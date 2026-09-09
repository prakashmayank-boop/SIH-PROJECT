from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any

from backend.app.services.ml_service import ml_adapter

router = APIRouter(prefix="/api/v1/ml", tags=["Machine Learning"])

class RetrainRequest(BaseModel):
    data_path: Optional[str] = None
    n_estimators: Optional[int] = 120
    max_depth: Optional[int] = 14

@router.get("/status")
def get_ml_status():
    """
    Returns current active ML model status, metrics (R2, RMSE, MAE), and feature importances.
    """
    return ml_adapter.get_model_status()

@router.post("/retrain")
def retrain_ml_model(req: RetrainRequest):
    """
    Triggers model retraining on a newly provided CSV of real sensor depths or the synthetic hydrodynamic dataset.
    """
    try:
        metadata = ml_adapter.retrain_model(data_path=req.data_path)
        return {
            "success": True,
            "message": "ML Model retrained successfully and updated in runtime memory.",
            "metadata": metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model retraining failed: {str(e)}")
