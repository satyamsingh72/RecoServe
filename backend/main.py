"""
main.py
-------
FastAPI application — in-memory recommendation serving platform.
"""

from __future__ import annotations

import logging
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

import data_loader
import pipeline as pl
from auth import RoleChecker, get_current_user, create_access_token, db, verify_password, get_password_hash, User, Token
from models import (
    HealthResponse,
    PipelineStatusResponse,
    RecommendationItem,
    RecommendationResponse,
    RefreshResponse,
    StatsResponse,
    CategoryStat,
    FeedbackRequest,
    FeedbackResponse,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

TOP_N_DEFAULT = int(os.getenv("TOP_N_DEFAULT", "10"))
PIPELINE_NAME = os.getenv("SAGEMAKER_PIPELINE_NAME", "mock-pipeline")


# ── App State ──────────────────────────────────────────────────────────────────

_startup_error: Optional[str] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _startup_error
    logger.info("Starting up — loading recommendation data …")
    try:
        data_loader.load_data()
        _startup_error = None
    except Exception as exc:
        _startup_error = str(exc)
        logger.exception("Startup data load failed: %s", exc)
    
    logger.info("Startup process complete.")
    yield
    logger.info("Shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Recommendation Serving API",
    description="Sub-10ms in-memory recommendation lookup + pipeline control",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth Routes ─────────────────────────────────────────────────────────────────
 
class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "Standard"
    is_active: bool = True

class UserUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordUpdate(BaseModel):
    password: str

@app.post("/login", response_model=Token, tags=["auth"])
async def login(req: LoginRequest):
    user = await db.users.find_one({"username": req.username})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been disabled. Please contact an administrator."
        )
    
    access_token = create_access_token(data={"sub": user["username"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users", tags=["admin"])
async def list_users(_ = Depends(RoleChecker(["Admin"]))):
    users = await db.users.find().to_list(length=100)
    # Clean MongoDB _id for JSON response
    return [{k: v for k, v in u.items() if k != "_id"} for u in users]

@app.post("/users", tags=["admin"])
async def create_user(req: UserCreate, _ = Depends(RoleChecker(["Admin"]))):
    if await db.users.find_one({"username": req.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_doc = {
        "username": req.username,
        "password": get_password_hash(req.password),
        "role": req.role,
        "is_active": req.is_active,
    }
    await db.users.insert_one(user_doc)
    return {"success": True, "message": f"User {req.username} created"}

@app.patch("/users/{username}", tags=["admin"])
async def update_user(username: str, req: UserUpdate, _ = Depends(RoleChecker(["Admin"]))):
    update_data = {}
    if req.role is not None: update_data["role"] = req.role
    if req.is_active is not None: update_data["is_active"] = req.is_active
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
        
    result = await db.users.update_one({"username": username}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": f"User {username} updated"}

@app.patch("/users/{username}/password", tags=["admin"])
async def change_password(username: str, req: PasswordUpdate, _ = Depends(RoleChecker(["Admin"]))):
    hashed = get_password_hash(req.password)
    result = await db.users.update_one({"username": username}, {"$set": {"password": hashed}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": f"Password for {username} updated"}

# ── Routes ────────────────────────────────────────────────────────────────────



@app.post(
    "/recommendations/{customer_id}/{product_id}/feedback",
    response_model=FeedbackResponse,
    tags=["recommendations"],
)
async def submit_feedback(
    customer_id: str,
    product_id: str,
    feedback: FeedbackRequest,
    _ = Depends(RoleChecker(["Admin"]))
):
    try:
        data_loader.record_feedback(customer_id, product_id, feedback.rating)
        return FeedbackResponse(success=True, message="Feedback recorded successfully")
    except Exception as exc:
        logger.exception("Failed to record feedback")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/health", response_model=HealthResponse, tags=["ops"])
async def health():
    status = "ok" if _startup_error is None else "degraded"
    return HealthResponse(
        status=status,
        mock_mode=os.getenv("MOCK_MODE", "true").lower() == "true",
        customers_in_memory=data_loader.customers_in_memory(),
        last_refresh_time=data_loader.get_last_refresh(),
    )


@app.get(
    "/recommendations/{customer_id}",
    response_model=RecommendationResponse,
    tags=["recommendations"],
)
async def get_recommendations(
    customer_id: str,
    top_n: int = Query(default=TOP_N_DEFAULT, ge=1, le=100),
    _ = Depends(RoleChecker(["Admin"]))
):
    t0 = time.perf_counter()
    recs = data_loader.get_recommendations(customer_id, top_n=top_n)
    latency_ms = round((time.perf_counter() - t0) * 1000, 3)

    if not recs:
        # Return empty list — caller decides how to handle
        return RecommendationResponse(
            customer_id=customer_id,
            recommendations=[],
            total=0,
            latency_ms=latency_ms,
        )

    return RecommendationResponse(
        customer_id=customer_id,
        recommendations=[RecommendationItem(**r) for r in recs],
        total=len(recs),
        latency_ms=latency_ms,
    )


@app.get("/stats", response_model=StatsResponse, tags=["analytics"])
async def get_stats(
    _ = Depends(RoleChecker(["Admin", "Standard"]))
):
    stats = data_loader.get_stats()
    if not stats:
        raise HTTPException(status_code=503, detail="Data not yet loaded")

    return StatsResponse(
        customers_covered=stats["customers_covered"],
        avg_recommendations_per_customer=stats["avg_recommendations_per_customer"],
        avg_lift=stats["avg_lift"],
        last_refresh_time=data_loader.get_last_refresh(),
        total_recommendations=stats["total_recommendations"],
        category_stats=[CategoryStat(**c) for c in stats["category_stats"]],
        lift_distribution=stats["lift_distribution"],
        score_distribution=stats["score_distribution"],
        top_products=stats["top_products"],
        quality_mix=stats["quality_mix"],
        segments=stats["segments"],
        feedback=stats["feedback"],
        model_health=stats["model_health"],
    )


@app.post("/data/refresh", response_model=RefreshResponse, tags=["ops"])
async def refresh_data(
    _ = Depends(RoleChecker(["Admin"]))
):
    try:
        data_loader.load_data()
        return RefreshResponse(
            success=True,
            message="Data reloaded successfully",
            customers_loaded=data_loader.customers_in_memory(),
            refresh_time=data_loader.get_last_refresh(),
        )
    except Exception as exc:
        logger.exception("Data refresh failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/pipeline/run", response_model=PipelineStatusResponse, tags=["pipeline"])
async def run_pipeline(
    _ = Depends(RoleChecker(["Admin"]))
):
    try:
        # Flush live feedback to S3 before starting the pipeline
        # This ensures Step 6 (Feedback Calibration) uses the latest data
        data_loader.flush_feedback_to_s3()
        
        state = await pl.trigger_pipeline()
        return PipelineStatusResponse(
            pipeline_name=PIPELINE_NAME,
            execution_arn=state.get("execution_arn"),
            status=state["status"],
            started_at=state.get("started_at"),
            ended_at=state.get("ended_at"),
            failure_reason=state.get("failure_reason"),
        )
    except Exception as exc:
        logger.exception("Pipeline trigger failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/pipeline/status", response_model=PipelineStatusResponse, tags=["pipeline"])
async def pipeline_status(
    _ = Depends(RoleChecker(["Admin"]))
):
    state = await pl.fetch_pipeline_status()
    return PipelineStatusResponse(
        pipeline_name=PIPELINE_NAME,
        execution_arn=state.get("execution_arn"),
        status=state["status"],
        started_at=state.get("started_at"),
        ended_at=state.get("ended_at"),
        failure_reason=state.get("failure_reason"),
    )
