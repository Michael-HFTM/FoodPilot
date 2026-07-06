# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FoodPilot is an automated pet feeding system running on a Raspberry Pi 4. An Angular SPA is served as static files by a FastAPI backend, which also exposes the REST API, runs scheduled feedings via APScheduler, and controls hardware via GPIO (gpiozero).

## Commands

### Backend (from repo root, venv activated)

```powershell
# Setup (once)
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt

# Run dev server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
# or from inside backend/
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs at `http://localhost:8000/docs`. No test framework or linter is configured yet.

### Frontend (from `frontend/`)

```bash
npm install       # once
ng serve          # dev server at http://localhost:4200 (proxies /api/* → :8000)
ng test           # unit tests (Vitest via @angular/build:unit-test)
ng build          # production build → frontend/dist/frontend/browser/
```

The dev server requires the FastAPI backend running on port 8000 for API calls.

### Deployment

```powershell
.\deploy.ps1              # build frontend, scp to Pi, pip install, restart service
.\deploy.ps1 -DryRun      # show what would run without executing
.\deploy.ps1 -SkipBuild   # reuse existing backend/static/
.\deploy.ps1 -SkipPip     # skip pip install on Pi
.\deploy.ps1 -NoRestart   # sync code without restarting the service
.\deploy.ps1 -PiUser admin -PiHost 192.168.1.50
```

`deploy.ps1` stages the backend (excluding `.venv`, `foodpilot.db`, `__pycache__`), copies it via `scp`, and restarts the `foodpilot` systemd service. The DB is never overwritten by a deploy.

## Architecture

```
backend/
├── main.py          # FastAPI app entry point; lifespan runs init_db() + scheduler; serves static/
├── database.py      # SQLAlchemy engine + session factory + init_db()
├── scheduler.py     # APScheduler BackgroundScheduler; one cron job per enabled schedule
├── api/             # Route handlers (feeding.py, status.py, history.py)
├── models/          # SQLAlchemy ORM models (base.py, feeding.py, status.py)
├── hardware/        # Hardware layer via gpiozero (dispenser.py, sensors.py)
└── static/          # Angular production build (served at /)

frontend/
└── src/app/
    ├── services/
    │   ├── feeding.ts             # HttpClient wrapper for /api/feeding/*
    │   ├── status.ts              # /api/status/
    │   ├── history.ts             # /api/history/
    │   └── overlay.ts             # cross-component UI state (FAB visibility, lastFeedAt)
    ├── components/
    │   ├── feeding-schedule/      # Schedule CRUD (main/default route)
    │   ├── feed-now-fab/          # Floating action button for manual trigger
    │   ├── nav-bar/               # Bottom navigation
    │   ├── status/                # Route: /status (bowl state, today's portions, last feeding)
    │   └── history/               # Route: /verlauf (feeding log with live refresh)
    └── app.routes.ts              # Routes: '' → FeedingSchedule, 'status', 'verlauf'
```

### Key design decisions

**Single-process deployment**: FastAPI serves both the Angular SPA (mounted at `/`) and the REST API (under `/api/`). The Angular build must be copied to `backend/static/` before it is served; if that directory is absent, `GET /` returns a JSON placeholder.

**Hardware layer with stub fallback**: `backend/hardware/dispenser.py` drives a PWM motor (gpiozero `PWMOutputDevice` on BCM 18, direction pin on BCM 23); `sensors.py` reads a digital bowl food sensor (BCM 17). GPIO devices are lazy-initialized on first use — if no real pin factory is available (e.g. Windows/dev machine), both modules log a warning once and fall back to stub behavior (no motor, sensor reads `True`). `SIZE_RUNTIME_SECONDS` in `dispenser.py` maps `small/medium/large` to motor run-time in seconds.

**Feeding verification**: `trigger_feeding()` runs the motor, then checks the bowl sensor; a feeding counts as failed if the bowl still reports no food. Every dispense (scheduled or manual) writes a `FeedingLog` row and a `SystemStatus` snapshot row.

**Scheduled feedings**: `backend/scheduler.py` holds an APScheduler `BackgroundScheduler`, started/stopped in the FastAPI lifespan. `reload_scheduler()` drops all jobs and re-registers a cron job per enabled `FeedingSchedule`; every schedule CRUD endpoint calls it after committing, so DB and scheduler never drift.

**Portion sizes**: The domain uses `small | medium | large` (enum `Size`), stored as strings in SQLite. The `FeedingLog` table records every dispense event (scheduled or manual), with `schedule_id = None` for manual triggers.

**DB location depends on CWD**: `database.py` uses `sqlite:///./foodpilot.db`, so the DB file is created in whatever directory uvicorn is started from. Run from `backend/` for a consistent path.

**Angular signals**: Components use Angular 22 signals (`signal()`, `computed()`, `effect()`) for local state rather than RxJS BehaviorSubjects. The status view additionally polls every 10 s via an RxJS `interval`.

**Proxy in dev**: `frontend/` has a `proxy.conf.json` that forwards `/api/*` to `http://localhost:8000`, so `ng serve` and the FastAPI dev server work together without CORS issues.

## Target Runtime

The Pi runs the backend as a `foodpilot` systemd service (`~/foodpilot/backend/`). See `docs/SystemdService.md` for service configuration and `docs/Deployment.md` for full deployment prerequisites.
