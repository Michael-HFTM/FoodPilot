import logging

from models.feeding import Size

logger = logging.getLogger(__name__)


# Placeholder runtime in seconds for each portion size.
# Will be replaced with real calibration once the dispenser hardware is defined.
SIZE_RUNTIME_SECONDS: dict[Size, int] = {
    Size.SMALL:  2,
    Size.MEDIUM: 4,
    Size.LARGE:  6,
}


def trigger_feeding(size: Size) -> bool:
    """
    Trigger the dispenser motor for the given portion size.
    Returns True on success, False on failure.
    Stub: logs only. Replace with GPIO implementation once hardware is defined.
    """
    runtime_s = SIZE_RUNTIME_SECONDS[size]
    logger.info(f"[STUB] Dispensing size={size.value} ({runtime_s}s)")
    # TODO: implement GPIO motor control
    return True
