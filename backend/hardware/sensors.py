import logging

logger = logging.getLogger(__name__)

PIN_FOOD_SENSOR = 24  # BCM numbering

_device = None
_device_init_failed = False


def _get_device():
    global _device, _device_init_failed
    if _device is not None or _device_init_failed:
        return _device
    try:
        from gpiozero import DigitalInputDevice
        _device = DigitalInputDevice(PIN_FOOD_SENSOR)
    except Exception:
        logger.warning(
            "GPIO pin factory unavailable, falling back to stub sensor reading",
            exc_info=True,
        )
        _device_init_failed = True
    return _device


def read_food_flowing() -> bool:
    """
    Read the flow sensor (digital 1/0 signal on PIN_FOOD_SENSOR).
    Returns True while food is falling past the sensor, False otherwise.
    Only meaningful while the dispenser motor is running.
    Falls back to a fixed stub value if no real GPIO pin factory is available.
    """
    device = _get_device()
    if device is None:
        logger.info("[STUB] Reading food sensor")
        return True
    return not bool(device.value)
