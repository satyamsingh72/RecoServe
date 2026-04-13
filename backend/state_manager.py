import json
import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

STATE_FILE = "pipeline_state.json"

class StateStore:
    """
    A simple file-based state store to ensure consistency across 
    multiple FastAPI workers.
    """
    
    @staticmethod
    def load() -> Dict[str, Any]:
        if not os.path.exists(STATE_FILE):
            return {
                "status": "IDLE",
                "execution_arn": None,
                "started_at": None,
                "ended_at": None,
                "failure_reason": None,
            }
        try:
            with open(STATE_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error("Failed to load state file: %s", e)
            return {}

    @staticmethod
    def save(state: Dict[str, Any]) -> None:
        try:
            # Ensure datetimes are converted to ISO strings for JSON
            serializable_state = {}
            for k, v in state.items():
                if isinstance(v, datetime):
                    serializable_state[k] = v.isoformat()
                else:
                    serializable_state[k] = v
            
            with open(STATE_FILE, "w") as f:
                json.dump(serializable_state, f, indent=4)
        except Exception as e:
            logger.error("Failed to save state file: %s", e)

    @classmethod
    def update(cls, **kwargs) -> Dict[str, Any]:
        state = cls.load()
        state.update(kwargs)
        cls.save(state)
        return state
