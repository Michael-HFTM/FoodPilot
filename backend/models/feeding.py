from enum import Enum

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from datetime import datetime

from models.base import Base


class Size(str, Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"


class FeedingSchedule(Base):
    __tablename__ = "feeding_schedule"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)          # e.g. "Morning"
    time       = Column(String, nullable=False)          # "HH:MM"
    size       = Column(String, nullable=False)          # Size: small | medium | large
    enabled    = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)


class FeedingLog(Base):
    __tablename__ = "feeding_log"

    id           = Column(Integer, primary_key=True, index=True)
    # None = manual trigger; set to NULL when the schedule is deleted
    schedule_id  = Column(
        Integer,
        ForeignKey("feeding_schedule.id", ondelete="SET NULL"),
        nullable=True,
    )
    triggered_at = Column(DateTime, default=datetime.now)
    size         = Column(String, nullable=False)        # Size at the time of dispense
    success      = Column(Boolean, nullable=False)
    note         = Column(String, nullable=True)         # error message if failed
