import logging

logger = logging.getLogger(__name__)


def trigger_feeding(portion_g: float) -> bool:
    """
    Trigger the dispenser motor.
    Returns True on success, False on failure.
    Stub: logs only. Replace with GPIO implementation once hardware is defined.
    """
    logger.info(f"[STUB] Dispensing {portion_g}g of food")
    # TODO: implement GPIO motor control
    return True
