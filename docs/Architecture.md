# Foodpilot – Architecture

## Overview

Foodpilot is an automated pet feeding system running on a Raspberry Pi 4.
The system provides a web-based interface for scheduling and monitoring feedings,
backed by a REST API and hardware control layer.

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Raspberry Pi 4                     │
│                                                     │
│  ┌─────────────┐        ┌──────────────────────┐    │
│  │   FastAPI   │        │   Hardware Layer     │    │
│  │             │◄──────►│                      │    │
│  │  REST API   │        │  GPIO / Sensors      │    │
│  │  /api/...   │        │  Motors / Actuators  │    │
│  │             │        └──────────────────────┘    │
│  │  Static     │                                    │
│  │  Files      │        ┌──────────────────────┐    │
│  │  /  (root)  │        │   SQLite DB          │    │
│  └─────────────┘◄──────►│   foodpilot.db       │    │
│         ▲               └──────────────────────┘    │
└─────────┼───────────────────────────────────────────┘
          │ HTTP (local network)
          │
┌─────────┴───────────┐
│   Browser           │
│   Angular App       │
│   (built & deployed)│
└─────────────────────┘
```

## Components

### Frontend (Angular)
- Developed locally, built with `ng build`
- Deployed as static files served by FastAPI
- Communicates with backend via REST API

**Responsibilities:**
- Feeding schedule management (create, edit, delete)
- Status display (today's portions, last feeding with success indicator) with 10 s polling
- Manual feeding trigger (floating action button)
- Feeding history / log view with live refresh

### Backend (FastAPI / Python)
- Runs as a systemd service on the Raspberry Pi
- Serves both the Angular build (static files) and the REST API
- Single entry point: `http://<pi-ip>:8000`

**Responsibilities:**
- REST API endpoints under `/api/`
- Automatic execution of feeding schedules (APScheduler, `scheduler.py`)
- Database access
- Triggering hardware actions and verifying feeding success

### Scheduler (APScheduler)
- A `BackgroundScheduler` is started/stopped in the FastAPI lifespan
- `reload_scheduler()` registers one cron job per enabled `feeding_schedule`
  row and is called after every schedule create/update/delete
- Each job dispenses the configured size and writes a `feeding_log` row

### Hardware Layer (Python module)
- Abstracted behind a clean interface (`hardware/dispenser.py`,
  `hardware/sensors.py`), decoupled from API logic
- Implemented with **gpiozero**; devices are lazy-initialized on first use
- On machines without a GPIO pin factory (e.g. the dev laptop) the modules
  fall back to logging-only stubs, so the backend runs anywhere

**Responsibilities:**
- Driving the dispenser motor: PWM on BCM pin 18, direction on BCM pin 23;
  run-time per portion size via `SIZE_RUNTIME_SECONDS` (small 10 s,
  medium 20 s, large 30 s)
- Reading the food flow sensor (digital input on BCM pin 24), which detects
  food falling past it while the motor runs
- Verifying a feeding: shortly after motor start, the flow sensor is polled
  for falling food; if none is detected within the detection window, the
  motor stops early and the feeding is logged as failed (hopper empty or
  jammed)
- Preventing overlapping feedings: a non-blocking lock rejects a second
  trigger while one is running (API responds 409, scheduler logs a skip)

### Database (SQLite)
- Embedded, no separate server required
- Managed via SQLAlchemy ORM

**Tables:**
- `feeding_schedule` – scheduled feeding times, size (`small` | `medium` | `large`), enabled flag
- `feeding_log` – history of executed feedings (size, success, note; `schedule_id = NULL` for manual triggers)

## Project Structure

```
foodpilot/
├── backend/
│   ├── main.py              # FastAPI app, lifespan (init_db + scheduler), static file serving
│   ├── scheduler.py         # APScheduler: cron jobs for enabled schedules
│   ├── api/
│   │   ├── feeding.py       # Schedule CRUD + manual trigger endpoints
│   │   └── history.py       # Feeding log endpoint
│   ├── hardware/
│   │   ├── __init__.py
│   │   ├── dispenser.py     # PWM motor control via gpiozero (stub fallback off-Pi)
│   │   └── sensors.py       # Food flow sensor via gpiozero (stub fallback off-Pi)
│   ├── models/
│   │   ├── base.py          # Declarative base
│   │   └── feeding.py       # FeedingSchedule, FeedingLog, Size enum
│   ├── database.py          # DB connection and session
│   └── requirements.txt
├── frontend/
│   ├── src/app/
│   │   ├── components/
│   │   │   ├── feeding-schedule/  # Schedule management (default route)
│   │   │   ├── status/            # Live status view (/status)
│   │   │   ├── history/           # Feeding history view (/verlauf)
│   │   │   ├── feed-now-fab/      # Manual feeding trigger
│   │   │   └── nav-bar/           # Bottom navigation
│   │   └── services/              # feeding, history, overlay
│   └── dist/                # Built output (deployed to Pi)
├── deploy.ps1               # PowerShell: build frontend + scp to Pi + restart service
├── docs/                    # This documentation
└── README.md
```

## Deployment

Development happens locally. Deployment to the Pi is done via `deploy.ps1`
(see `docs/Deployment.md`):

1. `npm run build` – builds the Angular app to `backend/static/`
2. `scp` – copies a staged copy of the backend (venv and DB excluded) to the Pi
3. `pip install` – installs requirements into `~/foodpilot/backend/.venv`
4. `systemctl restart foodpilot` – restarts the FastAPI service

The Pi is reachable via SSH in the local network:
```bash
ssh <user>@Pi-FoodPilot
```

The web app is accessible at:
```
http://Pi-FoodPilot:8000
```

## Technology Stack

| Layer      | Technology               | Reason                                              |
|------------|--------------------------|-----------------------------------------------------|
| Frontend   | Angular (signals)        | Team is actively learning it in class               |
| Backend    | FastAPI (Python)         | Lightweight, async, same language as hardware layer |
| Scheduling | APScheduler              | In-process cron jobs, no external scheduler needed  |
| Database   | SQLite + SQLAlchemy      | No server needed, sufficient for this use case      |
| Hardware   | gpiozero                 | Standard Pi GPIO library with pluggable pin factory |
| Runtime    | Raspberry Pi OS (64-bit) | Target hardware                                     |

## Out of Scope
- HTTPS / external access (possible later extension)
- Cloud backend
- Native mobile app
- Production-grade camera surveillance
