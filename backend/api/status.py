from fastapi import APIRouter
from pydantic import BaseModel

from hardware import sensors

router = APIRouter()


class StatusOut(BaseModel):
    food_present: bool


@router.get("/", response_model=StatusOut)
def get_status():
    return StatusOut(
        food_present=sensors.read_food_present(),
    )
