from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class GeoJSONGeometry(BaseModel):
    type: str
    coordinates: Any

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: GeoJSONGeometry
    properties: Dict[str, Any]

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

class RouteRequestModel(BaseModel):
    start: List[float] = Field(..., description="[lat, lon]")
    end: List[float] = Field(..., description="[lat, lon]")
    vehicle_type: str = Field(default="ambulance", description="ambulance, rescue_truck, car")
    horizon_step: str = Field(default="NOW", description="NOW, +30m, +1h, +2h, +3h")

class RouteResultModel(BaseModel):
    route_id: str
    vehicle_type: str
    normal_route: Dict[str, Any]
    flood_safe_route: Dict[str, Any]
    savings_explanation: str
    is_safe: bool
    status_label: str

class AlertStatusUpdate(BaseModel):
    status: str = Field(..., description="GENERATED, ACKNOWLEDGED, IN RESPONSE, RESOLVED")
    acknowledged_by: Optional[str] = "Control Room Operator"

class TaskCreate(BaseModel):
    task_type: str = "inspection"
    priority: str = "HIGH"
    target_description: str
    node_id: Optional[str] = None
    road_segment_id: Optional[str] = None
    target_geom: Optional[Dict[str, Any]] = None

class TaskComplete(BaseModel):
    observation: str = Field(..., description="blockage observed, water accumulation, pipe damage, no visible issue")
    notes: Optional[str] = ""

class ScenarioSwitchRequest(BaseModel):
    scenario_id: str = Field(..., description="monsoon_65, cloudburst_110, light_20")
    custom_rainfall_mmph: Optional[float] = None

class FloodReportCreate(BaseModel):
    lat: float
    lon: float
    depth_cm: float
    severity: str = "MODERATE"
    description: str
    source: str = "citizen"

class EdgeBlockageUpdate(BaseModel):
    blockage_percent: float = Field(..., ge=0.0, le=100.0, description="Blockage level 0-100%")
