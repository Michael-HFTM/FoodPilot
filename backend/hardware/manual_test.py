from gpiozero import PWMOutputDevice, DigitalOutputDevice
from time import sleep

PWM1 = PWMOutputDevice(18)
DIR1 = DigitalOutputDevice(23)

Vorwaerts = 1
Rueckwaerts = 0.5

while True:
    befehl = input("Befehl (start/back/stop/exit): ")

    if befehl == "start":
        DIR1.on()
        PWM1.value = Vorwaerts

    elif befehl == "back":
        DIR1.off()
        PWM1.value = Rueckwaerts

    elif befehl == "stop":
        PWM1.value = 0

    elif befehl == "exit":
        PWM1. value = 0
        break

    else:
        print("Unbekannter Befehl")