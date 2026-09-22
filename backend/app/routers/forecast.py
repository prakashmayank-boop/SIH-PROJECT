from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.schemas_v1 import RoadSegment, DrainageNode, DrainageEdge
import backend.app.services.hydraulic_engine as he
from backend.app.services.hydraulic_engine import (
    calculate_hydraulic_state, calculate_road_flood_depths, get_current_rainfall
)
from backend.app.services.cache import hydraulic_cache

router = APIRouter(prefix="/api/v1", tags=["Forecast"])

def get_hydraulic_and_roads(db: Session, horizon: str):
    """Retrieve or compute cached coupled hydrodynamic state and road flood depths."""
    cache_key = f"hydro_{he.active_scenario_id}_{he.custom_intensity_override}_{horizon}"
    cached = hydraulic_cache.get(cache_key)
    if cached is not None:
        return cached

    nodes = db.query(DrainageNode).all()
    edges = db.query(DrainageEdge).all()
    roads = db.query(RoadSegment).all()

    hydraulic_state = calculate_hydraulic_state(nodes, edges, horizon_step=horizon)
    road_depths = calculate_road_flood_depths(roads, hydraulic_state, horizon_step=horizon)

    hydraulic_cache.set(cache_key, (hydraulic_state, road_depths), ttl=5.0)
    return (hydraulic_state, road_depths)

def compute_risk_primary_cause(attributions: dict) -> str:
    if not attributions:
        return "Precipitation runoff"
    rain = attributions.get("rainfall_intensity_mmh", 0.0)
    surcharge = attributions.get("upstream_node_surcharge_m3s", 0.0)
    terrain = attributions.get("depression_depth_m", 0.0) + attributions.get("road_slope_percent", 0.0)

    causes = []
    if rain > 60:
        causes.append("Intense rainfall event")
    if surcharge > 30:
        causes.append("Drainage bottleneck (surcharge)")
    if terrain > 25:
        causes.append("Low-lying terrain micro-basin")

    if causes:
        return " + ".join(causes)

    top_key = max(attributions, key=attributions.get)
    label_map = {
        "rainfall_intensity_mmh": "Intense rainfall event",
        "upstream_node_surcharge_m3s": "Drainage bottleneck (surcharge)",
        "depression_depth_m": "Low-lying terrain micro-basin",
        "road_slope_percent": "Adverse terrain slope runoff",
        "pipe_capacity_ratio": "Drainage network backwater limit"
    }
    return label_map.get(top_key, "Coupled hydrodynamic runoff")

def normalize_horizon(h: str) -> str:
    h = (h or "NOW").strip()
    if h == "NOW" or h.startswith("+"):
        return h
    return "+" + h

@router.get("/flood-forecast")
def get_flood_forecast(
    horizon: str = Query("NOW", description="NOW, +30m, +1h, +2h, +3h"),
    db: Session = Depends(get_db)
):
    horizon = normalize_horizon(horizon)
    hydraulic_state, road_depths = get_hydraulic_and_roads(db, horizon)

    # Convert to GeoJSON FeatureCollection
    features = []
    for r in road_depths:
        attributions = r.get("feature_attributions", {})
        risk_primary_cause = compute_risk_primary_cause(attributions)

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": r["coordinates"]
            },
            "properties": {
                "road_id": r["road_id"],
                "external_id": r["external_id"],
                "name": r["name"],
                "road_class": r["road_class"],
                "elevation_m": r["elevation_m"],
                "elevation_amsl": r.get("elevation_amsl", r["elevation_m"]),
                "predicted_depth_cm": r["predicted_depth_cm"],
                "risk_level": r["risk_level"],
                "risk_color": r["risk_color"],
                "risk_primary_cause": risk_primary_cause,
                "feature_attributions": attributions,
                "max_safe_depth_cm": r["max_safe_depth_cm"],
                "is_emergency_corridor": r["is_emergency_corridor"],
                "passable_vehicle_classes": r["passable_vehicle_classes"],
                "confidence": r["confidence"],
                "horizon": horizon
            }
        })

    return {
        "type": "FeatureCollection",
        "rainfall": hydraulic_state["rainfall"],
        "features": features
    }

@router.get("/forecast/summary")
def get_forecast_summary(
    horizon: str = Query("NOW", description="NOW, +30m, +1h, +2h, +3h"),
    db: Session = Depends(get_db)
):
    horizon = normalize_horizon(horizon)
    hydraulic_state, road_depths = get_hydraulic_and_roads(db, horizon)

    max_depth = max([r["predicted_depth_cm"] for r in road_depths], default=0.0)
    critical_roads = sum(1 for r in road_depths if r["risk_level"] in ["High", "Critical"])
    surcharged_nodes = sum(1 for n in hydraulic_state["nodes"].values() if n["status"] in ["OVERLOADED", "CRITICAL"])
    
    # Risk index 0-100
    risk_index = min(100, int((max_depth / 35.0) * 80 + (surcharged_nodes * 10)))

    horizon_confidence = {
        "NOW": 0.94,
        "+30m": 0.91,
        "+1h": 0.88,
        "+2h": 0.82,
        "+3h": 0.74
    }.get(horizon, 0.89)

    return {
        "horizon": horizon,
        "rainfall_mmph": hydraulic_state["rainfall"]["intensity_mmph"],
        "scenario_name": hydraulic_state["rainfall"]["scenario_name"],
        "flood_risk_index": risk_index,
        "max_predicted_depth_cm": max_depth,
        "critical_road_count": critical_roads,
        "surcharged_node_count": surcharged_nodes,
        "peak_flood_time": "+1h",
        "highest_risk_area": "ST Bed & 80 Feet Road Basin (Ward 151)",
        "confidence_score": horizon_confidence
    }
