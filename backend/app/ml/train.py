import os
import sys
import json
import argparse
import datetime
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

from backend.app.ml.dataset import FEATURE_COLUMNS, TARGET_COLUMN, load_or_create_dataset

MODEL_DIR = "backend/models"
MODEL_PATH = os.path.join(MODEL_DIR, "flood_depth_model.joblib")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")

def train_model(data_path: str = None, n_estimators: int = 120, max_depth: int = 14) -> dict:
    """
    Trains an ensemble regressor for urban street inundation depth nowcasting.
    Evaluates metrics and exports the model and metadata.
    """
    print("=" * 60)
    print("  UFIS Machine Learning Flood Depth Model Training Pipeline")
    print("=" * 60)

    # 1. Load Data
    if data_path and os.path.exists(data_path):
        print(f"[ML Pipeline] Loading user-provided dataset from: {data_path}")
        df = pd.read_csv(data_path)
    else:
        print("[ML Pipeline] Loading / Generating hydrodynamic baseline dataset...")
        df = load_or_create_dataset()

    print(f"[ML Pipeline] Dataset loaded with {len(df)} samples across {len(FEATURE_COLUMNS)} features.")

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    # 2. Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"[ML Pipeline] Training set: {len(X_train)} samples | Test set: {len(X_test)} samples.")

    # 3. Model Architecture: Tuned Random Forest Regressor
    model = RandomForestRegressor(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )

    print("[ML Pipeline] Training Random Forest Regressor...")
    model.fit(X_train, y_train)

    # 4. Evaluation
    y_pred = model.predict(X_test)
    y_pred = np.maximum(0.0, y_pred) # Depths cannot be negative

    r2 = float(r2_score(y_test, y_pred))
    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))

    # Feature Importance
    importances = model.feature_importances_
    feat_imp_dict = {
        feat: float(round(imp, 4))
        for feat, imp in sorted(zip(FEATURE_COLUMNS, importances), key=lambda x: x[1], reverse=True)
    }

    print("\n--- Model Evaluation Results ---")
    print(f"  R² Score (Variance Explained): {r2:.4f} (Goal: > 0.90)")
    print(f"  MAE (Mean Absolute Error)     : {mae:.2f} cm")
    print(f"  RMSE (Root Mean Square Error) : {rmse:.2f} cm")
    print("\n--- Feature Importance Breakdown ---")
    for feat, imp in feat_imp_dict.items():
        print(f"  - {feat:30s}: {imp * 100:5.2f}%")

    # 5. Export Model & Metadata
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"\n[ML Pipeline] Model artifact saved to: {MODEL_PATH}")

    metadata = {
        "model_name": "UFIS-RandomForest-HydrodynamicDepthRegressor",
        "version": "1.0.0",
        "trained_at": datetime.datetime.utcnow().isoformat() + "Z",
        "data_source": data_path if data_path else "synthetic_hydrodynamic_corpus_v1",
        "n_samples": len(df),
        "metrics": {
            "r2_score": round(r2, 4),
            "mae_cm": round(mae, 2),
            "rmse_cm": round(rmse, 2)
        },
        "features": FEATURE_COLUMNS,
        "feature_importances": feat_imp_dict
    }

    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[ML Pipeline] Metadata saved to: {METADATA_PATH}")
    print("=" * 60)
    return metadata

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train UFIS Flood Depth ML Model")
    parser.add_argument("--data", type=str, default=None, help="Path to real depth sensor data CSV")
    parser.add_argument("--trees", type=int, default=120, help="Number of trees")
    parser.add_argument("--depth", type=int, default=14, help="Max tree depth")
    args = parser.parse_args()

    train_model(data_path=args.data, n_estimators=args.trees, max_depth=args.depth)
