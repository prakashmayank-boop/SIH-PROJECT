import os
import logging
from typing import Dict, Any, Optional

from backend.app.ml.inference import predictor, FloodDepthPredictor
from backend.app.ml.train import train_model

logger = logging.getLogger("ufis.ml_service")

class MLFloodPredictionAdapter:
    """
    Adapter integrating the Machine Learning Flood Depth Regressor 
    (RandomForest + GradientBoosting trained on hydrodynamic parameters)
    with the real-time UFIS Hydraulic Engine.
    """
    def __init__(self):
        self.predictor = predictor

    @property
    def is_custom_model_loaded(self) -> bool:
        return self.predictor.is_loaded

    @property
    def model_name(self) -> str:
        if self.predictor.is_loaded and self.predictor.metadata:
            return self.predictor.metadata.get("model_name", "Random Forest Regressor")
        return "Physics-Hydraulic Baseline (Manning + SCS-CN)"

    def predict_road_depth(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Infers flood depth in cm given road & weather features.
        """
        return self.predictor.predict_depth(features)

    def retrain_model(self, data_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrains model on new sensor CSV data and reloads into memory.
        """
        metadata = train_model(data_path=data_path)
        self.predictor.load_model()
        return metadata

    def get_model_status(self) -> Dict[str, Any]:
        """
        Returns active model metrics, feature importances, and version info.
        """
        if not self.predictor.is_loaded or not self.predictor.metadata:
            return {
                "is_loaded": False,
                "model_name": "Baseline Empirical Physics",
                "metrics": {},
                "features": []
            }
        return {
            "is_loaded": True,
            "model_name": self.predictor.metadata.get("model_name"),
            "version": self.predictor.metadata.get("version"),
            "trained_at": self.predictor.metadata.get("trained_at"),
            "data_source": self.predictor.metadata.get("data_source"),
            "metrics": self.predictor.metadata.get("metrics"),
            "feature_importances": self.predictor.metadata.get("feature_importances"),
            "features": self.predictor.metadata.get("features")
        }

ml_adapter = MLFloodPredictionAdapter()
