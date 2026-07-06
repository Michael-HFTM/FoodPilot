from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from models.base import Base


class SystemStatus(Base):
    __tablename__ = "system_status"

    id           = Column(Integer, primary_key=True, index=True)
    recorded_at  = Column(DateTime, default=datetime.now)
    food_present = Column(Boolean, nullable=False)
    error_msg    = Column(String,  nullable=True)
