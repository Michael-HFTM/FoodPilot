from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean
from datetime import datetime
from models.base import Base


class SystemStatus(Base):
    __tablename__ = "system_status"

    id          = Column(Integer, primary_key=True, index=True)
    recorded_at = Column(DateTime, default=datetime.now)
    fill_level  = Column(Float,   nullable=True)   # 0.0 – 1.0, None if unknown
    is_blocked  = Column(Boolean, default=False)
    error_msg   = Column(String,  nullable=True)
