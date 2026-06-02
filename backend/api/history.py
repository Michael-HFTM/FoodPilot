from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models.feeding import FeedingLog

router = APIRouter()


class LogOut(BaseModel):
    id:           int
    schedule_id:  int | None
    triggered_at: datetime
    portion_g:    float
    success:      bool
    note:         str | None

    class Config:
        from_attributes = True


@router.get("/", response_model=list[LogOut])
def get_history(limit: int = Query(50, le=500), db: Session = Depends(get_db)):
    return (
        db.query(FeedingLog)
        .order_by(FeedingLog.triggered_at.desc())
        .limit(limit)
        .all()
    )
