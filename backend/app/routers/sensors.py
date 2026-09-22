from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.app.database import get_db
from backend.app.models.schemas_v1 import Sensor, SensorReading, MonitoringSite, FloodReport
from backend.app.schemas.pydantic_models import ScenarioSwitchRequest, FloodReportCreate
from backend.app.services.hydraulic_engine import set_active_scenario, SCENARIOS, active_scenario_id
from backend.app.config import settings

from backend.app.services.cache import hydraulic_cache

router = APIRouter(prefix="/api/v1", tags=["Sensors & Scenarios"])

@router.get("/sensors")
def get_sensors(db: Session = Depends(get_db)):
    sensors = db.query(Sensor).all()
    if not sensors:
        return {
            "summary": {"total": 0, "online": 0, "offline": 0, "warning": 0},
            "sensors": []
        }

    # Batch fetch all related sites in a single query
    site_ids = {s.site_id for s in sensors if s.site_id}
    sites_map = {}
    if site_ids:
        sites = db.query(MonitoringSite).filter(MonitoringSite.site_id.in_(site_ids)).all()
        sites_map = {site.site_id: site for site in sites}

    # Batch fetch latest readings in a single query
    sensor_ids = [s.sensor_id for s in sensors]
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.sensor_id.in_(sensor_ids))
        .order_by(SensorReading.observed_at.desc())
        .all()
    )
    latest_readings = {}
    for r in readings:
        if r.sensor_id not in latest_readings:
            latest_readings[r.sensor_id] = r

    results = []
    for s in sensors:
        site = sites_map.get(s.site_id)
        reading = latest_readings.get(s.sensor_id)
        results.append({
            "sensor_id": s.sensor_id,
            "device_id": s.external_device_id,
            "name": site.name if site else s.external_device_id,
            "sensor_type": s.sensor_type,
            "unit": s.unit,
            "status": s.status,
            "coordinates": site.geom["coordinates"] if site else [77.6265, 12.9345],
            "last_value": reading.value if reading else 0.0,
            "last_seen_at": s.last_seen_at.isoformat() if s.last_seen_at else None
        })

    online_count = sum(1 for s in results if s["status"] == "ONLINE")
    return {
        "summary": {
            "total": len(results),
            "online": online_count,
            "offline": len(results) - online_count,
            "warning": 0
        },
        "sensors": results
    }

@router.post("/simulation/scenario")
def switch_simulation_scenario(req: ScenarioSwitchRequest):
    set_active_scenario(req.scenario_id, req.custom_rainfall_mmph)
    hydraulic_cache.clear()
    if req.scenario_id == "custom":
        sc_name = f"Custom Simulation ({req.custom_rainfall_mmph or 65.0} mm/h)"
        base_int = req.custom_rainfall_mmph or 65.0
    else:
        sc = SCENARIOS.get(req.scenario_id, SCENARIOS["monsoon_65"])
        sc_name = sc["name"]
        base_int = req.custom_rainfall_mmph or sc["base_intensity"]
    return {
        "status": "success",
        "active_scenario": req.scenario_id,
        "scenario_name": sc_name,
        "base_intensity_mmph": base_int,
        "message": f"Active simulation updated to {sc_name}. Flood nowcast recalculated."
    }

@router.get("/simulation/scenarios")
def list_scenarios():
    return [
        {"id": k, "name": v["name"], "base_intensity": v["base_intensity"], "is_active": k == active_scenario_id}
        for k, v in SCENARIOS.items()
    ]

@router.get("/reports/flood")
def get_flood_reports(include_completed: bool = False, db: Session = Depends(get_db)):
    query = db.query(FloodReport)
    if not include_completed:
        query = query.filter(FloodReport.verification_status != "COMPLETED")
    reports = query.order_by(FloodReport.reported_at.desc()).limit(50).all()
    results = []
    for r in reports:
        coords = r.geom.get("coordinates", [77.6265, 12.9345]) if isinstance(r.geom, dict) else [77.6265, 12.9345]
        results.append({
            "report_id": r.flood_report_id,
            "source": r.source,
            "reported_at": r.reported_at.isoformat() if r.reported_at else None,
            "coordinates": coords,
            "depth_cm": r.depth_cm or 0.0,
            "severity": r.severity or "MODERATE",
            "description": r.description or "Reported water accumulation",
            "verification_status": r.verification_status or "UNVERIFIED"
        })
    return results

@router.post("/reports/flood")
def submit_flood_report(req: FloodReportCreate, db: Session = Depends(get_db)):
    report = FloodReport(
        tenant_id=settings.DEFAULT_TENANT_ID,
        city_id=settings.DEFAULT_CITY_ID,
        source=req.source,
        reported_at=datetime.now(timezone.utc),
        geom={"type": "Point", "coordinates": [req.lon, req.lat]},
        depth_cm=req.depth_cm,
        severity=req.severity,
        description=req.description,
        verification_status="UNVERIFIED"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {
        "report_id": report.flood_report_id,
        "status": "received",
        "message": "Flood report logged successfully. Incident queued for operator review."
    }

@router.patch("/reports/flood/{report_id}/complete")
def complete_flood_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(FloodReport).filter_by(flood_report_id=report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.verification_status = "COMPLETED"
    report.verified_at = datetime.now(timezone.utc)
    report.verified_by = "Control Room Operator"
    db.commit()
    return {"report_id": report_id, "status": "COMPLETED", "message": "Report marked as completed"}


