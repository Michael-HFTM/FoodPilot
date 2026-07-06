from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Literal

from database import get_db
from models.feeding import FeedingSchedule, FeedingLog, Size
from models.status import SystemStatus
from hardware.dispenser import trigger_feeding
from scheduler import reload_scheduler

router = APIRouter()

SizeLiteral = Literal["small", "medium", "large"]


# --- Schemas ---

class ScheduleCreate(BaseModel):
    name:    str
    time:    str                  # "HH:MM"
    size:    SizeLiteral
    enabled: bool = True


class ScheduleOut(ScheduleCreate):
    id:         int
    created_at: datetime

    class Config:
        from_attributes = True


class TriggerResult(BaseModel):
    success: bool
    size:    SizeLiteral


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
    reload_scheduler()
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
    reload_scheduler()
    return schedule


@router.delete("/{schedule_id}", status_code=204)
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.get(FeedingSchedule, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(schedule)
    db.commit()
    reload_scheduler()


@router.post("/trigger", response_model=TriggerResult, status_code=200)
def manual_trigger(
    size: SizeLiteral = Query("medium"),
    db: Session = Depends(get_db),
):
    """Manually trigger a feeding of the given size."""
    success = trigger_feeding(Size(size))
    log = FeedingLog(
        schedule_id=None,
        size=size,
        success=success,
        note=None if success else "Manual trigger failed",
    )
    db.add(log)
    db.add(SystemStatus(
        food_present=success,
        error_msg=None if success else "Schale nach Fütterung weiterhin leer",
    ))
    db.commit()
    return TriggerResult(success=success, size=size)
