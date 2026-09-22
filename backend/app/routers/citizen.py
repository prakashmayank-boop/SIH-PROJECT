from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel

from backend.app.database import get_db
from backend.app.models.schemas_v1 import FloodReport
from backend.app.config import settings

router = APIRouter(prefix="/api/v1/citizen", tags=["Citizen Portal"])

class CitizenReportIn(BaseModel):
    lat: float
    lon: float
    depth_cm: Optional[float] = 10.0
    severity: Optional[str] = "MODERATE"
    description: str
    source: Optional[str] = "citizen"
    public_ticket_id: Optional[str] = None
    water_depth_category: Optional[str] = None
    category: Optional[str] = None
    road_name: Optional[str] = None
    media_data_urls: Optional[List[str]] = None

@router.get("/reports")
def list_citizen_reports(include_completed: bool = False, db: Session = Depends(get_db)):
    """Fetch all citizen reports for both public portal and admin command center."""
    query = db.query(FloodReport)
    if not include_completed:
        query = query.filter(FloodReport.verification_status != "COMPLETED")
    reports = query.order_by(FloodReport.reported_at.desc()).limit(100).all()
    results = []
    for r in reports:
        coords = r.geom.get("coordinates", [77.6265, 12.9345]) if isinstance(r.geom, dict) else [77.6265, 12.9345]
        results.append({
            "report_id": r.flood_report_id,
            "source": r.source or "citizen",
            "reported_at": r.reported_at.isoformat() if r.reported_at else None,
            "coordinates": coords,
            "latitude": coords[1] if len(coords) > 1 else 12.9345,
            "longitude": coords[0] if len(coords) > 0 else 77.6265,
            "depth_cm": r.depth_cm or 0.0,
            "severity": r.severity or "MODERATE",
            "description": r.description or "Citizen report",
            "media_uri": r.media_uri,
            "verification_status": r.verification_status or "UNVERIFIED"
        })
    return results

@router.post("/reports")
def create_citizen_report(payload: CitizenReportIn, db: Session = Depends(get_db)):
    """Ingest a new citizen observation into the UFIS hydraulic nowcasting engine."""
    first_media = None
    if payload.media_data_urls and len(payload.media_data_urls) > 0:
        first_media = payload.media_data_urls[0]

    report = FloodReport(
        tenant_id=settings.DEFAULT_TENANT_ID,
        city_id=settings.DEFAULT_CITY_ID,
        source=payload.source or "citizen",
        reported_at=datetime.now(timezone.utc),
        geom={"type": "Point", "coordinates": [payload.lon, payload.lat]},
        depth_cm=payload.depth_cm,
        severity=payload.severity or "MODERATE",
        description=payload.description,
        media_uri=first_media,
        verification_status="UNVERIFIED"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "report_id": report.flood_report_id,
        "public_ticket_id": payload.public_ticket_id or f"UFIS-2026-{report.flood_report_id[:5]}",
        "status": "RECEIVED",
        "message": "Citizen observation ingested successfully and queued for municipal control room review."
    }

@router.patch("/reports/{report_id}/verify")
def verify_citizen_report(report_id: str, status: str = "VERIFIED", db: Session = Depends(get_db)):
    """Allow control room operator to verify or reject a citizen flood report."""
    report = db.query(FloodReport).filter_by(flood_report_id=report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.verification_status = status
    report.verified_at = datetime.now(timezone.utc)
    report.verified_by = "Control Room Operator"
    db.commit()
    return {"report_id": report_id, "verification_status": status}
