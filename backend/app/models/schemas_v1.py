import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

def gen_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class Tenant(Base):
    __tablename__ = "tenants"
    tenant_id = Column(String(64), primary_key=True, default=gen_uuid)
    name = Column(String(160), nullable=False)
    slug = Column(String(80), unique=True, nullable=False)
    status = Column(String(24), default="active")
    settings = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class User(Base):
    __tablename__ = "users"
    user_id = Column(String(64), primary_key=True, default=gen_uuid)
    email = Column(String(120), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(String(32), default="operator") # operator, field_crew, admin
    tenant_id = Column(String(64), ForeignKey("tenants.tenant_id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)


class City(Base):
    __tablename__ = "cities"
    city_id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.tenant_id"), nullable=False)
    name = Column(String(120), nullable=False)
    state = Column(String(100), default="Karnataka")
    country_code = Column(String(2), default="IN")
    timezone = Column(String(64), default="Asia/Kolkata")
    boundary = Column(JSON, default=dict) # GeoJSON MultiPolygon/Polygon
    created_at = Column(DateTime, default=utc_now)

class Zone(Base):
    __tablename__ = "zones"
    zone_id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.tenant_id"), nullable=False)
    city_id = Column(String(64), ForeignKey("cities.city_id"), nullable=False)
    name = Column(String(120), nullable=False)
    zone_type = Column(String(40), default="ward")
    risk_priority = Column(Integer, default=1)
    boundary = Column(JSON, default=dict)

class DrainageNode(Base):
    __tablename__ = "drainage_nodes"
    node_id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.tenant_id"), nullable=False)
    city_id = Column(String(64), ForeignKey("cities.city_id"), nullable=False)
    zone_id = Column(String(64), ForeignKey("zones.zone_id"), nullable=True)
    node_code = Column(String(80), nullable=False, unique=True)
    node_type = Column(String(32), default="manhole") # inlet, manhole, junction, outfall, retention_basin
    geom = Column(JSON, nullable=False) # GeoJSON Point {type: "Point", coordinates: [lon, lat]}
    ground_elev_m = Column(Float, default=900.0)
    invert_elev_m = Column(Float, default=897.0)
    rim_elev_m = Column(Float, default=900.2)
    inlet_capacity_m3s = Column(Float, default=1.5)
    status = Column(String(24), default="NORMAL") # NORMAL, AT RISK, OVERLOADED, CRITICAL, UNKNOWN
    metadata_json = Column(JSON, default=dict)
    deleted_at = Column(DateTime, nullable=True)

class DrainageEdge(Base):
    __tablename__ = "drainage_edges"
    edge_id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.tenant_id"), nullable=False)
    city_id = Column(String(64), ForeignKey("cities.city_id"), nullable=False)
    from_node_id = Column(String(64), ForeignKey("drainage_nodes.node_id"), nullable=False)
    to_node_id = Column(String(64), ForeignKey("drainage_nodes.node_id"), nullable=False)
    edge_code = Column(String(80), nullable=False, unique=True)
    edge_type = Column(String(32), default="pipe") # pipe, drain, open_channel, culvert
    geom = Column(JSON, nullable=False) # GeoJSON LineString
    length_m = Column(Float, default=100.0)
    diameter_m = Column(Float, default=0.9)
    width_m = Column(Float, nullable=True)
    height_m = Column(Float, nullable=True)
    slope = Column(Float, default=0.005)
    manning_n = Column(Float, default=0.015)
    design_capacity_m3s = Column(Float, default=2.5)
    effective_capacity_factor = Column(Float, default=1.0)
    blockage_percent = Column(Float, default=0.0)
    status = Column(String(24), default="NORMAL") # NORMAL, AT RISK, OVERLOADED, CRITICAL
    deleted_at = Column(DateTime, nullable=True)

class RoadSegment(Base):
    __tablename__ = "road_segments"
    road_segment_id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.tenant_id"), nullable=False)
    city_id = Column(String(64), ForeignKey("cities.city_id"), nullable=False)
    zone_id = Column(String(64), ForeignKey("zones.zone_id"), nullable=True)
    external_road_id = Column(String(120), nullable=True)
    name = Column(String(180), nullable=False)
    road_class = Column(String(40), default="primary") # primary, secondary, tertiary, residential
    geom = Column(JSON, nullable=False) # GeoJSON LineString
    length_m = Column(Float, default=300.0)
    baseline_speed_kph = Column(Float, default=40.0)
    max_safe_depth_cm = Column(Integer, default=15)
    is_emergency_corridor = Column(Boolean, default=False)
    elevation_m = Column(Float, default=898.0)
    impervious_percent = Column(Float, default=85.0)
    deleted_at = Column(DateTime, nullable=True)

class MonitoringSite(Base):
    __tablename__ = "monitoring_sites"
    site_id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.tenant_id"), nullable=False)
    city_id = Column(String(64), ForeignKey("cities.city_id"), nullable=False)
    zone_id = Column(String(64), ForeignKey("zones.zone_id"), nullable=True)
    name = Column(String(150), nullable=False)
    site_type = Column(String(40), default="drain") # drain, road, nullah, rain_gauge
    geom = Column(JSON, nullable=False) # GeoJSON Point
    node_id = Column(String(64), ForeignKey("drainage_nodes.node_id"), nullable=True)
    edge_id = Column(String(64), ForeignKey("drainage_edges.edge_id"), nullable=True)
    road_segment_id = Column(String(64), ForeignKey("road_segments.road_segment_id"), nullable=True)
    active = Column(Boolean, default=True)
    access_notes = Column(Text, nullable=True)

class Sensor(Base):
    __tablename__ = "sensors"
    sensor_id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.tenant_id"), nullable=False)
    site_id = Column(String(64), ForeignKey("monitoring_sites.site_id"), nullable=False)
    external_device_id = Column(String(128), unique=True, nullable=False)
    sensor_type = Column(String(40), default="water_level") # water_level, flow, rain_gauge, camera
    manufacturer = Column(String(100), default="IoT Sense Labs")
    model = Column(String(100), default="UFIS-WL-v2")
    unit = Column(String(24), default="cm")
    status = Column(String(24), default="ONLINE") # ONLINE, OFFLINE, WARNING
    last_seen_at = Column(DateTime, default=utc_now)
    config = Column(JSON, default=dict)

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    reading_id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.tenant_id"), nullable=False)
    sensor_id = Column(String(64), ForeignKey("sensors.sensor_id"), nullable=False)
    observed_at = Column(DateTime, default=utc_now)
    received_at = Column(DateTime, default=utc_now)
    value = Column(Float, nullable=False)
    unit = Column(String(24), default="cm")
    quality_flag = Column(String(24), default="GOOD")
    raw_payload = Column(JSON, default=dict)
    ingestion_source = Column(String(32), default="mqtt_gateway")

class ModelRun(Base):
    __tablename__ = "model_runs"
    model_run_id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.tenant_id"), nullable=False)
    city_id = Column(String(64), ForeignKey("cities.city_id"), nullable=False)
    run_type = Column(String(32), default="simulated") # simulated, operational, backtest
    requested_at = Column(DateTime, default=utc_now)
    forecast_start_at = Column(DateTime, default=utc_now)
    horizon_minutes = Column(Integer, default=180) # 0-3h
    status = Column(String(24), default="completed") # queued, running, completed, failed
    input_manifest = Column(JSON, default=dict) # scenario details, rainfall mm/h
    output_manifest = Column(JSON, default=dict)

class NodeForecast(Base):
    __tablename__ = "node_forecasts"
    node_forecast_id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), nullable=False)
    model_run_id = Column(String(64), ForeignKey("model_runs.model_run_id"), nullable=False)
    node_id = Column(String(64), ForeignKey("drainage_nodes.node_id"), nullable=False)
    valid_at = Column(DateTime, nullable=False)
    horizon_step = Column(String(16), default="NOW") # NOW, +30m, +1h, +2h, +3h
    predicted_water_level_m = Column(Float, default=0.5)
    predicted_inflow_m3s = Column(Float, default=0.8)
    predicted_overflow_m3s = Column(Float, default=0.0)
    surcharge_probability = Column(Float, default=0.1)
    confidence = Column(Float, default=0.92)

class RoadFloodForecast(Base):
    __tablename__ = "road_flood_forecasts"
    road_flood_forecast_id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), nullable=False)
    model_run_id = Column(String(64), ForeignKey("model_runs.model_run_id"), nullable=False)
    road_segment_id = Column(String(64), ForeignKey("road_segments.road_segment_id"), nullable=False)
    valid_at = Column(DateTime, nullable=False)
    horizon_step = Column(String(16), default="NOW") # NOW, +30m, +1h, +2h, +3h
    predicted_depth_cm = Column(Float, default=0.0)
    risk_level = Column(String(24), default="Low") # Low, Moderate, High, Critical
    confidence = Column(Float, default=0.88)
    passable_vehicle_classes = Column(JSON, default=list) # ["ambulance", "rescue_truck", "car"]

class Alert(Base):
    __tablename__ = "alerts"
    alert_id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.tenant_id"), nullable=False)
    city_id = Column(String(64), ForeignKey("cities.city_id"), nullable=False)
    model_run_id = Column(String(64), nullable=True)
    node_id = Column(String(64), nullable=True)
    road_segment_id = Column(String(64), nullable=True)
    severity = Column(String(24), default="HIGH") # WATCH, WARNING, CRITICAL
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(24), default="GENERATED") # GENERATED, ACKNOWLEDGED, IN RESPONSE, RESOLVED
    raised_at = Column(DateTime, default=utc_now)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String(64), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    payload = Column(JSON, default=dict)

class DispatchTask(Base):
    __tablename__ = "dispatch_tasks"
    dispatch_task_id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.tenant_id"), nullable=False)
    city_id = Column(String(64), ForeignKey("cities.city_id"), nullable=False)
    alert_id = Column(String(64), ForeignKey("alerts.alert_id"), nullable=True)
    task_type = Column(String(40), default="inspection") # inspection, pump, barricade, drain_cleaning
    priority = Column(String(24), default="HIGH") # LOW, MEDIUM, HIGH, URGENT
    status = Column(String(24), default="ASSIGNED") # ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
    target_geom = Column(JSON, nullable=True)
    target_description = Column(Text, nullable=False)
    assigned_organization_id = Column(String(64), nullable=True)
    assigned_to_user_id = Column(String(64), nullable=True)
    created_by = Column(String(64), default="system_dispatcher")
    assigned_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
    completion_notes = Column(Text, nullable=True)
    observation = Column(String(64), nullable=True) # blockage observed, water accumulation, pipe damage, no visible issue

class FloodReport(Base):
    __tablename__ = "flood_reports"
    flood_report_id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), nullable=False)
    city_id = Column(String(64), nullable=False)
    reporter_user_id = Column(String(64), nullable=True)
    source = Column(String(32), default="citizen") # citizen, staff, cctv, traffic_police, simulated
    reported_at = Column(DateTime, default=utc_now)
    geom = Column(JSON, nullable=False) # GeoJSON Point
    depth_cm = Column(Float, nullable=True)
    severity = Column(String(24), default="MODERATE")
    description = Column(Text, nullable=True)
    media_uri = Column(Text, nullable=True)
    verification_status = Column(String(24), default="UNVERIFIED") # UNVERIFIED, VERIFIED, REJECTED
    verified_by = Column(String(64), nullable=True)
    verified_at = Column(DateTime, nullable=True)
