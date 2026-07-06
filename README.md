# Food Pilot
A project at HFTM for the course BB24.3a.GS400 / Project-Oriented Engineering

## Raspberry Pi Setup
| Parameter | Value                        |
|:----------|:-----------------------------|
| Device    | Raspberry Pi 4               |
| OS        | Raspberry Pi OS Lite (64-bit) |
| host-name | `Pi-FoodPilot`               |  

*For access credentials contact Michael*

Access in local Network via ssh:
```bash
ssh <insertUserName>@Pi-FoodPilot
```

We used the `Raspberry Pi Imager` to flash an SD-Card with a headless OS.<br>
See: [Raspberry Pi Documentation - Install an OS onto boot media](https://www.raspberrypi.com/documentation/computers/getting-started.html#install)

## Project Documentation
- [Architecture](docs/Architecture.md) — system overview, components, tech stack
- [Backend Setup](docs/Backend.md) — local FastAPI development
- [Frontend Setup](docs/Frontend.md) — local Angular development
- [Python venv Setup](docs/SetUpPythonVenv.md)
- [Deployment](docs/Deployment.md) — `deploy.ps1`, Pi prerequisites, troubleshooting
- [Systemd Service](docs/SystemdService.md) — `foodpilot.service` configuration