from fastapi import APIRouter
from pydantic import BaseModel

from hardware.sensors import read_fill_level, is_blocked

router = APIRouter()


class StatusOut(BaseModel):
    fill_level: float | None
    is_blocked: bool


@router.get("/", response_model=StatusOut)
def get_status():
    return StatusOut(
        fill_level=read_fill_level(),
        is_blocked=is_blocked(),
    )