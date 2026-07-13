from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.feeding import FeedingLog

router = APIRouter()


class StatusOut(BaseModel):
    food_present: bool


@router.get("/", response_model=StatusOut)
def get_status(db: Session = Depends(get_db)):
    # The flow sensor only yields a signal while food is falling during a
    # dispense, so there is no live bowl reading. Report whether the most
    # recent feeding dispensed successfully instead.
    last = (
        db.query(FeedingLog)
        .order_by(FeedingLog.triggered_at.desc())
        .first()
    )
    return StatusOut(food_present=last.success if last else False)
