import logging

logger = logging.getLogger(__name__)


def read_fill_level() -> float | None:
    """
    Read the fill-level sensor.
    Returns a float 0.0–1.0, or None if the sensor is unavailable.
    Stub: returns a fixed value. Replace with real sensor read.
    """
    logger.info("[STUB] Reading fill level")
    # TODO: implement actual sensor read
    return 0.75


def is_blocked() -> bool:
    """
    Check whether the dispenser is blocked.
    Stub: always returns False.
    """
    logger.info("[STUB] Checking for blockage")
    # TODO: implement blockage detection
    return False
