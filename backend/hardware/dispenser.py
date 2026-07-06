import logging
from time import sleep

from gpiozero import DigitalOutputDevice, PWMOutputDevice

from models.feeding import Size

logger = logging.getLogger(__name__)

# GPIO channels
PWM_PIN = 18
DIR_PIN = 23
pwm = PWMOutputDevice(PWM_PIN)
direction = DigitalOutputDevice(DIR_PIN)

DISPENSE_SPEED = 1

# runtime in seconds for each portion size.
SIZE_RUNTIME_SECONDS: dict[Size, int] = {
    Size.SMALL:  10,
    Size.MEDIUM: 20,
    Size.LARGE:  30,
}

def trigger_feeding(size: Size) -> bool:
    """
    Trigger the dispenser motor for the given portion size.
    Returns True on success, False on failure.
    """
    runtime_s = SIZE_RUNTIME_SECONDS[size]
    logger.info(f"Dispensing size={size.value} ({runtime_s}s)")
    try:
        # TODO: evtl. richtung anpassen
        direction.on()
        pwm.value = DISPENSE_SPEED
        sleep(runtime_s)
        return True

    except Exception:
        logger.exception(f"Failed to dispense size={size.value}")
        return False

    finally:
        pwm.value = 0
