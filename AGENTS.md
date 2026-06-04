# FoodPilot – AGENTS.md

## Setup

```powershell
cd backend
python -m venv ..\.venv
..\\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Run dev server: `uvicorn main:app --reload --host 0.0.0.0 --port 8000` (run from `backend/`)

## Structure

```
backend/
  main.py              # FastAPI entry point — routers + static file mount
  database.py          # SQLAlchemy engine, session, init_db()
  api/                 # FastAPI routers (feeding, status, history)
  hardware/            # Hardware abstraction (currently stubs)
  models/              # SQLAlchemy ORM models
frontend/              # Angular app (not yet created)
docs/                  # Architecture.md, setup guides
```

## Key facts

- **With `__init__.py`** in all backend packages (`api/`, `models/`, `hardware/`).
- **Hardware layer** (`hardware/dispenser.py`, `hardware/sensors.py`) is stub-only. Look for `[STUB]` and `TODO` comments.
- **DB file** `foodpilot.db` is created at runtime in the working directory. `init_db()` auto-imports models to register them with Base.
- **Static files**: if `backend/static/` exists (Angular build output), FastAPI mounts it at `/`. Otherwise returns JSON placeholder.
- **No tests, linter, or formatter** configured yet.

## API endpoints

| Method | Path | Tag |
|--------|------|-----|
| GET | `/api/feeding/` | list schedules |
| POST | `/api/feeding/` | create schedule |
| PUT | `/api/feeding/{id}` | update schedule |
| DELETE | `/api/feeding/{id}` | delete schedule |
| POST | `/api/feeding/trigger` | manual feed |
| GET | `/api/status/` | system status (fill level, blocked) |
| GET | `/api/history/` | feeding log (default limit 50, max 500) |
| GET | `/` | root (JSON or Angular SPA) |

## Deployment (to Pi)

Per `docs/Architecture.md`: `ng build` → rsync → `systemctl restart foodpilot`. `deploy.sh` is planned but not yet implemented.
