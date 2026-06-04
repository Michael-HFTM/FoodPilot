from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Literal

from database import get_db
from models.feeding import FeedingLog

router = APIRouter()

SizeLiteral = Literal["small", "medium", "large"]


class LogOut(BaseModel):
    id:           int
    schedule_id:  int | None
    triggered_at: datetime
    size:         SizeLiteral
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
