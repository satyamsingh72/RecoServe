from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class RecommendationItem(BaseModel):
    product_id: str
    score: float
    confidence: float
    lift: float
    l2_category: str
    l3_category: str
    rank: int

class FeedbackRequest(BaseModel):
    rating: int  # 1 for positive, -1 for negative, 0 for neutral
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    success: bool
    message: str


class RecommendationResponse(BaseModel):
    customer_id: str
    recommendations: List[RecommendationItem]
    total: int
    served_from: str = "memory"
    latency_ms: Optional[float] = None


class CategoryStat(BaseModel):
    category: str
    avg_score: float
    avg_lift: float
    count: int


class StatsResponse(BaseModel):
    customers_covered: int
    avg_recommendations_per_customer: float
    avg_lift: float
    last_refresh_time: Optional[datetime]
    total_recommendations: int
    category_stats: List[CategoryStat]
    lift_distribution: List[dict]   # [{bucket, count}]
    score_distribution: List[dict]  # [{bucket, count}]
    top_products: List[dict]        # [{product_id, count, avg_score}]
    quality_mix: dict               # {association, fallback}
    segments: List[str]
    feedback: Optional[dict]
    health: dict = Field(alias="model_health")

    model_config = {
        "populate_by_name": True
    }             # {avg_silhouette, cluster_distribution, status}


class PipelineStatusResponse(BaseModel):
    pipeline_name: str
    execution_arn: Optional[str]
    status: str  # IDLE | STARTING | RUNNING | SUCCEEDED | FAILED | STOPPED
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    failure_reason: Optional[str] = None


class RefreshResponse(BaseModel):
    success: bool
    message: str
    customers_loaded: int
    refresh_time: datetime


class HealthResponse(BaseModel):
    status: str
    mock_mode: bool
    customers_in_memory: int
    last_refresh_time: Optional[datetime]
