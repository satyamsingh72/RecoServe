"""
pipeline.py
-----------
SageMaker pipeline control — trigger + status.
Falls back to a mock implementation when MOCK_MODE=true.
"""

from __future__ import annotations

import asyncio
import logging
import os
import random
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

from state_manager import StateStore

# ── Shared pipeline state ───────────────────────────────────────
# State is now managed by StateStore to ensure consistency across workers


async def trigger_pipeline() -> dict:
    """Trigger AppFlow flows in AWS."""
    import boto3
    
    region = os.getenv("AWS_REGION", "eu-central-1")
    appflow = boto3.client("appflow", region_name=region)
    
    # Diagnostic: List all available flows to find the correct names
    try:
        available_flows = appflow.list_flows()
        flow_names = [f['flowName'] for f in available_flows.get('flows', [])]
        logger.info("Available AppFlow names in %s: %s", region, flow_names)
    except Exception as e:
        logger.error("Could not list available flows: %s", e)

    flows = [
        "salesforce-to-s3",
        "salesforce-to-s3-invoices",
        "salesforce-to-s3-products"
    ]
    
    triggered_flows = []
    for flow_name in flows:
        try:
            appflow.start_flow(flowName=flow_name)
            triggered_flows.append(flow_name)
            logger.info("Successfully triggered AppFlow: %s", flow_name)
        except Exception as e:
            logger.error("Failed to trigger AppFlow %s: %s", flow_name, e)

    if not triggered_flows:
        raise RuntimeError("Failed to trigger any AppFlow flows. Please check the logs for 'Available AppFlow names'.")

    return {
        "status": "RUNNING",
        "execution_arn": f"arn:aws:appflow:{region}:appflow-sync-event",
        "started_at": datetime.utcnow().isoformat(),
        "ended_at": None,
        "failure_reason": None,
        "triggered_flows": triggered_flows
    }


async def fetch_pipeline_status() -> dict:
    """Fetch latest execution status (or mock)."""
    mock_mode = os.getenv("MOCK_MODE", "true").lower() == "true"

    if mock_mode:
        return StateStore.load()
    else:
        return await _sagemaker_status()


# ── Mock implementation ───────────────────────────────────────────────────────


async def _mock_trigger() -> dict:
    state = StateStore.load()
    if state["status"] == "RUNNING":
        return state

    state = StateStore.update(
        status="RUNNING",
        execution_arn=f"arn:aws:sagemaker:us-east-1:123456789012:pipeline/mock-pipeline/execution/{random.randint(10000,99999)}",
        started_at=datetime.utcnow(),
        ended_at=None,
        failure_reason=None,
    )
    logger.info("Mock pipeline started: %s", state["execution_arn"])

    # Simulate completion after a delay (non-blocking)
    asyncio.create_task(_mock_complete())
    return state


async def _mock_complete():
    await asyncio.sleep(random.uniform(8, 15))  # simulate 8-15s pipeline run
    StateStore.update(
        status="SUCCEEDED",
        ended_at=datetime.utcnow()
    )
    logger.info("Mock pipeline completed successfully")


# ── Real SageMaker implementation ─────────────────────────────────────────────


async def _sagemaker_trigger() -> dict:
    import boto3

    pipeline_name = os.getenv("SAGEMAKER_PIPELINE_NAME", "mock-pipeline")
    region = os.getenv("AWS_REGION", "us-east-1")
    sm = boto3.client("sagemaker", region_name=region)

    response = sm.start_pipeline_execution(PipelineName=pipeline_name)
    arn = response["PipelineExecutionArn"]

    state = StateStore.update(
        status="RUNNING",
        execution_arn=arn,
        started_at=datetime.utcnow(),
        ended_at=None,
        failure_reason=None,
    )
    logger.info("SageMaker pipeline triggered: %s", arn)
    return state


async def _sagemaker_status() -> dict:
    state = StateStore.load()
    arn = state.get("execution_arn")
    if not arn:
        return state

    import boto3

    region = os.getenv("AWS_REGION", "us-east-1")
    sm = boto3.client("sagemaker", region_name=region)
    resp = sm.describe_pipeline_execution(PipelineExecutionArn=arn)

    sm_status = resp.get("PipelineExecutionStatus", "UNKNOWN")
    # Map SM statuses → our statuses
    status_map = {
        "Executing": "RUNNING",
        "Succeeded": "SUCCEEDED",
        "Failed": "FAILED",
        "Stopped": "STOPPED",
        "Stopping": "RUNNING",
    }
    
    updates = {
        "status": status_map.get(sm_status, sm_status.upper()),
        "failure_reason": resp.get("FailureReason"),
    }
    
    if updates["status"] in ("SUCCEEDED", "FAILED", "STOPPED"):
        updates["ended_at"] = datetime.utcnow()
    
    return StateStore.update(**updates)
