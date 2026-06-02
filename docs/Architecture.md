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
- Live status display (fill level, last feeding, errors)
- Manual feeding trigger
- Feeding history / log view

### Backend (FastAPI / Python)
- Runs as a systemd service on the Raspberry Pi
- Serves both the Angular build (static files) and the REST API
- Single entry point: `http://<pi-ip>:8000`

**Responsibilities:**
- REST API endpoints under `/api/`
- Business logic (scheduling, portion calculation)
- Database access
- Triggering hardware actions

### Hardware Layer (Python module)
- Abstracted behind a clean interface, decoupled from API logic
- Initially implemented as stubs (logging only)
- Replaced with real GPIO implementation once hardware is defined

**Planned responsibilities:**
- Triggering the dispenser motor
- Reading fill-level sensor
- Detecting faults / blockages

### Database (SQLite)
- Embedded, no separate server required
- Managed via SQLAlchemy ORM

**Planned tables:**
- `feeding_schedule` – scheduled feeding times and portions
- `feeding_log` – history of executed feedings
- `system_status` – current sensor readings and error states

## Project Structure

```
foodpilot/
├── backend/
│   ├── main.py              # FastAPI app, static file serving
│   ├── api/
│   │   ├── feeding.py       # Feeding schedule endpoints
│   │   ├── status.py        # System status endpoints
│   │   └── history.py       # Feeding log endpoints
│   ├── hardware/
│   │   ├── __init__.py
│   │   ├── dispenser.py     # Motor control (stub -> real)
│   │   └── sensors.py       # Fill level, fault detection (stub -> real)
│   ├── models/
│   │   ├── feeding.py       # SQLAlchemy models
│   │   └── status.py
│   ├── database.py          # DB connection and session
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── schedule/    # Schedule management feature
│   │       ├── status/      # Live status feature
│   │       └── history/     # Feeding history feature
│   └── dist/                # Built output (deployed to Pi)
├── deploy.sh                # Build frontend + rsync to Pi + restart service
├── ARCHITECTURE.md
└── README.md
```

## Deployment

Development happens locally. Deployment to the Pi is done via `deploy.sh`:

1. `ng build` – builds the Angular app to `frontend/dist/`
2. `rsync` – copies backend + frontend build to the Pi
3. `systemctl restart foodpilot` – restarts the FastAPI service

The Pi is reachable via SSH in the local network:
```bash
ssh <user>@Pi-FoodPilot
```

The web app is accessible at:
```
http://Pi-FoodPilot:8000
```

## Technology Stack

| Layer    | Technology               | Reason                                              |
|----------|--------------------------|-----------------------------------------------------|
| Frontend | Angular                  | Team is actively learning it in class               |
| Backend  | FastAPI (Python)         | Lightweight, async, same language as hardware layer |
| Database | SQLite + SQLAlchemy      | No server needed, sufficient for this use case      |
| Hardware | RPi.GPIO / gpiozero      | Standard Pi GPIO libraries                          |
| Runtime  | Raspberry Pi OS (64-bit) | Target hardware                                     |

## Out of Scope
- HTTPS / external access (possible later extension)
- Cloud backend
- Native mobile app
- Production-grade camera surveillance
