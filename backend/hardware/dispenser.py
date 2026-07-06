import logging
from time import sleep

from hardware import sensors
from models.feeding import Size

logger = logging.getLogger(__name__)

# GPIO channels
PWM_PIN = 18
DIR_PIN = 23

DISPENSE_SPEED = 1

# runtime in seconds for each portion size.
SIZE_RUNTIME_SECONDS: dict[Size, int] = {
    Size.SMALL:  10,
    Size.MEDIUM: 20,
    Size.LARGE:  30,
}

_pwm = None
_direction = None
_motor_init_failed = False


def _get_motor_devices():
    global _pwm, _direction, _motor_init_failed
    if _pwm is not None or _motor_init_failed:
        return _pwm, _direction
    try:
        from gpiozero import DigitalOutputDevice, PWMOutputDevice
        _pwm = PWMOutputDevice(PWM_PIN)
        _direction = DigitalOutputDevice(DIR_PIN)
    except Exception:
        logger.warning(
            "GPIO pin factory unavailable, falling back to stub motor control",
            exc_info=True,
        )
        _motor_init_failed = True
    return _pwm, _direction


def trigger_feeding(size: Size) -> bool:
    """
    Trigger the dispenser motor for the given portion size, then verify
    the bowl sensor reports food present. Returns False if the motor
    itself failed or if the bowl sensor still reports no food afterwards.
    Falls back to a stub (no motor control) if no real GPIO pin factory
    is available.
    """
    runtime_s = SIZE_RUNTIME_SECONDS[size]
    logger.info(f"Dispensing size={size.value} ({runtime_s}s)")
    pwm, direction = _get_motor_devices()
    if pwm is None:
        logger.info(f"[STUB] Dispensing size={size.value} ({runtime_s}s)")
        return sensors.read_food_present()

    try:
        # TODO: evtl. richtung anpassen
        direction.on()
        pwm.value = DISPENSE_SPEED
        sleep(runtime_s)
        return sensors.read_food_present()

    except Exception:
        logger.exception(f"Failed to dispense size={size.value}")
        return False

    finally:
        pwm.value = 0
