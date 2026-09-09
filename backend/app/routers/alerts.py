from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.app.database import get_db
from backend.app.models.schemas_v1 import Alert, DrainageNode, DrainageEdge, RoadSegment
from backend.app.schemas.pydantic_models import AlertStatusUpdate
from backend.app.services.hydraulic_engine import calculate_hydraulic_state, calculate_road_flood_depths

router = APIRouter(prefix="/api/v1/alerts", tags=["Alerts"])

SECTORS = [
    {
        "id": "ALERT-STBED",
        "title": "Severe Inundation Warning — ST Bed Main & 80 Feet Rd Basin",
        "nodes": ["MH-04", "MH-07"],
        "roads": ["80 Feet Road (Sony World Stretch)", "ST Bed Main Low-Lying Avenue"],
        "severity": "CRITICAL"
    },
    {
        "id": "ALERT-SONYWORLD",
        "title": "Junction Hydraulic Warning — Sony World Signal & Ejipura Link",
        "nodes": ["MH-03", "MH-01"],
        "roads": ["80 Feet Road (Sony World Stretch)", "Ejipura Canal Service Road"],
        "severity": "WARNING"
    },
    {
        "id": "ALERT-MAHARAJA",
        "title": "Conduit Surcharge Warning — Maharaja Signal & 100 Feet Corridor",
        "nodes": ["MH-06", "MH-02"],
        "roads": ["100 Feet Road (Maharaja Junction Link)", "Koramangala 6th Block Outer Ring Link"],
        "severity": "WARNING"
    },
    {
        "id": "ALERT-SARJAPUR",
        "title": "Backwater Stress Warning — Sarjapur Approach & Outfall Basin",
        "nodes": ["MH-10", "MH-05", "MH-09"],
        "roads": ["Sarjapur Road Approach Link", "Wipro Park Radial Connector"],
        "severity": "CRITICAL"
    }
]

@router.get("")
def get_alerts(db: Session = Depends(get_db)):
    nodes = db.query(DrainageNode).all()
    edges = db.query(DrainageEdge).all()
    roads = db.query(RoadSegment).all()

    hydraulic_state = calculate_hydraulic_state(nodes, edges, "NOW")
    road_depths = calculate_road_flood_depths(roads, hydraulic_state, "NOW")

    db_alerts = db.query(Alert).order_by(Alert.raised_at.desc()).all()
    db_alerts_map = {a.alert_id: a for a in db_alerts}

    dynamic_alerts = []
    processed_ids = set()

    for sec in SECTORS:
        active_nodes = [code for code in sec["nodes"] if hydraulic_state["nodes"].get(code, {}).get("status") in ["OVERLOADED", "CRITICAL"]]
        if active_nodes:
            max_depth = max([r["predicted_depth_cm"] for r in road_depths if r["name"] in sec["roads"]], default=22.0)
            node_str = " and ".join(active_nodes)
            msg = f"Hydraulic surcharge detected at {node_str}. Predicted street flood depth exceeding {max_depth:.1f} cm in the next 30-45 minutes."

            status = "GENERATED"
            ack_at = None
            ack_by = None
            res_at = None

            if sec["id"] in db_alerts_map:
                existing = db_alerts_map[sec["id"]]
                status = existing.status
                ack_at = existing.acknowledged_at.isoformat() if existing.acknowledged_at else None
                ack_by = existing.acknowledged_by
                res_at = existing.resolved_at.isoformat() if existing.resolved_at else None
                processed_ids.add(sec["id"])

            dynamic_alerts.append({
                "alert_id": sec["id"],
                "severity": sec["severity"],
                "title": sec["title"],
                "message": msg,
                "status": status,
                "raised_at": datetime.now(timezone.utc).isoformat(),
                "acknowledged_at": ack_at,
                "acknowledged_by": ack_by,
                "resolved_at": res_at,
                "payload": {
                    "affected_roads": sec["roads"],
                    "max_predicted_depth_cm": max_depth,
                    "critical_nodes": active_nodes
                }
            })

    # Add any extra DB alerts
    for a in db_alerts:
        if a.alert_id not in processed_ids:
            dynamic_alerts.append({
                "alert_id": a.alert_id,
                "severity": a.severity,
                "title": a.title,
                "message": a.message,
                "status": a.status,
                "raised_at": a.raised_at.isoformat() if a.raised_at else None,
                "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None,
                "acknowledged_by": a.acknowledged_by,
                "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
                "payload": a.payload
            })

    return dynamic_alerts

@router.patch("/{alert_id}/status")
def update_alert_status(
    alert_id: str,
    update: AlertStatusUpdate,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter_by(alert_id=alert_id).first()
    if not alert:
        # Create DB record if dynamic alert was acknowledged
        alert = Alert(
            alert_id=alert_id,
            tenant_id="tenant-bbmp-01",
            city_id="city-blr-01",
            severity="CRITICAL",
            title=f"Alert {alert_id}",
            message="Dynamic early warning alert",
            status=update.status
        )
        db.add(alert)

    alert.status = update.status
    if update.status == "ACKNOWLEDGED":
        alert.acknowledged_at = datetime.now(timezone.utc)
        alert.acknowledged_by = update.acknowledged_by
    elif update.status == "RESOLVED":
        alert.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(alert)
    return {
        "alert_id": alert.alert_id,
        "status": alert.status,
        "message": f"Alert state transitioned to {alert.status}"
    }

from pydantic import BaseModel
from typing import Optional
from backend.app.services.sms_service import sms_service

class SMSBroadcastRequest(BaseModel):
    alert_id: Optional[str] = "ALERT-STBED"
    title: Optional[str] = "Severe Flood Inundation Warning"
    severity: Optional[str] = "CRITICAL"
    affected_roads: Optional[list] = []
    max_depth_cm: Optional[float] = 28.5
    critical_nodes: Optional[list] = []
    recipient_group: Optional[str] = "all_citizens"
    custom_phone: Optional[str] = None
    custom_message: Optional[str] = None

@router.post("/broadcast-sms")
def broadcast_sms(req: SMSBroadcastRequest):
    """Dispatch emergency SMS flood warning to citizens or response teams."""
    result = sms_service.broadcast_sms(
        alert_id=req.alert_id or "ALERT-GEN",
        title=req.title or "Emergency Flood Alert",
        severity=req.severity or "CRITICAL",
        affected_roads=req.affected_roads or ["80 Feet Road", "ST Bed Basin"],
        max_depth_cm=req.max_depth_cm or 28.5,
        critical_nodes=req.critical_nodes or ["MH-04", "MH-07"],
        recipient_group=req.recipient_group or "all_citizens",
        custom_phone=req.custom_phone,
        custom_message=req.custom_message
    )
    return result

@router.get("/sms-logs")
def get_sms_logs():
    """Retrieve audit dispatch log of all emergency SMS alerts sent."""
    return sms_service.get_dispatch_logs()


