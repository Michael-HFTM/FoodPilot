from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models.feeding import FeedingSchedule, FeedingLog
from hardware.dispenser import trigger_feeding

router = APIRouter()


# --- Schemas ---

class ScheduleCreate(BaseModel):
    name:      str
    time:      str    # "HH:MM"
    portion_g: float
    enabled:   bool = True


class ScheduleOut(ScheduleCreate):
    id:         int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Endpoints ---

@router.get("/", response_model=list[ScheduleOut])
def list_schedules(db: Session = Depends(get_db)):
    return db.query(FeedingSchedule).all()


@router.post("/", response_model=ScheduleOut, status_code=201)
def create_schedule(payload: ScheduleCreate, db: Session = Depends(get_db)):
    schedule = FeedingSchedule(**payload.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(schedule_id: int, payload: ScheduleCreate, db: Session = Depends(get_db)):
    schedule = db.get(FeedingSchedule, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    for key, value in payload.model_dump().items():
        setattr(schedule, key, value)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}", status_code=204)
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.get(FeedingSchedule, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(schedule)
    db.commit()


@router.post("/trigger", status_code=200)
def manual_trigger(portion_g: float = 50.0, db: Session = Depends(get_db)):
    """Manually trigger a feeding."""
    success = trigger_feeding(portion_g)
    log = FeedingLog(
        schedule_id=None,
        portion_g=portion_g,
        success=success,
        note=None if success else "Manual trigger failed",
    )
    db.add(log)
    db.commit()
    return {"success": success, "portion_g": portion_g}