from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal

from database import get_db
from models.feeding import FeedingSchedule, FeedingLog, Size
from hardware.dispenser import DispenserBusyError, trigger_feeding
from scheduler import reload_scheduler

router = APIRouter()

SizeLiteral = Literal["small", "medium", "large"]


# --- Schemas ---

class ScheduleCreate(BaseModel):
    name:    str
    # "HH:MM", 24h — invalid values would poison reload_scheduler() after commit
    time:    str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
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
    try:
        success = trigger_feeding(Size(size))
    except DispenserBusyError:
        raise HTTPException(status_code=409, detail="Es läuft bereits eine Fütterung")
    db.add(FeedingLog(
        schedule_id=None,
        size=size,
        success=success,
        note=None if success else "Manual trigger failed",
    ))
    db.commit()
    return TriggerResult(success=success, size=size)
