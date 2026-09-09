from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.schemas_v1 import RoadSegment, DrainageNode, DrainageEdge
from backend.app.schemas.pydantic_models import RouteRequestModel, RouteResultModel
from backend.app.services.hydraulic_engine import calculate_hydraulic_state, calculate_road_flood_depths
from backend.app.services.routing_engine import calculate_routes

router = APIRouter(prefix="/api/v1/route", tags=["Routing"])

@router.post("/safe")
def find_safe_route(
    req: RouteRequestModel,
    db: Session = Depends(get_db)
):
    nodes = db.query(DrainageNode).all()
    edges = db.query(DrainageEdge).all()
    roads = db.query(RoadSegment).all()

    horizon = (req.horizon_step or "NOW").strip()
    if horizon != "NOW" and not horizon.startswith("+"):
        horizon = "+" + horizon

    hydraulic_state = calculate_hydraulic_state(nodes, edges, horizon_step=horizon)
    road_forecasts = calculate_road_flood_depths(roads, hydraulic_state, horizon_step=horizon)

    result = calculate_routes(
        start_point=req.start,
        end_point=req.end,
        vehicle_type=req.vehicle_type,
        road_forecasts=road_forecasts
    )
    return result
