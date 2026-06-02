from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from datetime import datetime
from models.base import Base


class FeedingSchedule(Base):
    __tablename__ = "feeding_schedule"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)          # e.g. "Morning"
    time       = Column(String, nullable=False)          # "HH:MM"
    portion_g  = Column(Float,  nullable=False)          # grams
    enabled    = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class FeedingLog(Base):
    __tablename__ = "feeding_log"

    id           = Column(Integer, primary_key=True, index=True)
    schedule_id  = Column(Integer, nullable=True)        # None = manual trigger
    triggered_at = Column(DateTime, default=datetime.utcnow)
    portion_g    = Column(Float,  nullable=False)
    success      = Column(Boolean, nullable=False)
    note         = Column(String, nullable=True)         # error message if failed