# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.app.database import get_db
from backend.app.models.schemas_v1 import DispatchTask
from backend.app.schemas.pydantic_models import TaskCreate, TaskComplete
from backend.app.config import settings

router = APIRouter(prefix="/api/v1/tasks", tags=["Field Tasks"])

@router.get("")
def get_tasks(include_completed: bool = False, db: Session = Depends(get_db)):
    query = db.query(DispatchTask)
    if not include_completed:
        query = query.filter(DispatchTask.status != "COMPLETED")
    tasks = query.order_by(DispatchTask.assigned_at.desc()).all()
    return [
        {
            "task_id": t.dispatch_task_id,
            "task_type": t.task_type,
            "priority": t.priority,
            "status": t.status,
            "target_description": t.target_description,
            "target_geom": t.target_geom,
            "assigned_at": t.assigned_at.isoformat() if t.assigned_at else None,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None,
            "completion_notes": t.completion_notes,
            "observation": t.observation
        }
        for t in tasks
    ]

@router.post("")
def create_task(req: TaskCreate, db: Session = Depends(get_db)):
    task = DispatchTask(
        tenant_id=settings.DEFAULT_TENANT_ID,
        city_id=settings.DEFAULT_CITY_ID,
        task_type=req.task_type,
        priority=req.priority,
        target_description=req.target_description,
        target_geom=req.target_geom or {"type": "Point", "coordinates": [77.6285, 12.9330]},
        status="ASSIGNED"
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return {
        "task_id": task.dispatch_task_id,
        "status": task.status,
        "message": "Field inspection task created and assigned to response team"
    }

@router.patch("/{task_id}/complete")
def complete_task(
    task_id: str,
    req: TaskComplete,
    db: Session = Depends(get_db)
):
    task = db.query(DispatchTask).filter_by(dispatch_task_id=task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = "COMPLETED"
    task.completed_at = datetime.now(timezone.utc)
    task.observation = req.observation
    task.completion_notes = req.notes
    db.commit()
    db.refresh(task)
    return {
        "task_id": task.dispatch_task_id,
        "status": task.status,
        "observation": task.observation,
        "message": "Inspection completed. Ground observation recorded to verify predictive model."
    }
