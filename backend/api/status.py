from fastapi import APIRouter
from pydantic import BaseModel

from hardware import sensors

router = APIRouter()


class StatusOut(BaseModel):
    fill_level: float | None
    is_blocked: bool


@router.get("/", response_model=StatusOut)
def get_status():
    return StatusOut(
        fill_level=sensors.read_fill_level(),
        is_blocked=sensors.is_blocked(),
    )
