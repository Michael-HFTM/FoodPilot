# FoodPilot – AGENTS.md

## Setup

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

Backend dev server:
```powershell
# from repo root
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
# or from backend/ (note: no `backend.` prefix)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend (separate terminal, from `frontend/`):
```
npm install
ng serve    # → http://localhost:4200, proxies /api → backend:8000
```

Tests:
- Frontend: `ng test` (Vitest via `@angular/build:unit-test`)
- Backend: none configured

## Structure

```
backend/
  main.py              # FastAPI app — imports routers + mounts static
  database.py          # SQLAlchemy engine, session, init_db()
  api/                 # Routers: feeding, status, history
  hardware/            # Stubs: dispenser, sensors (+ orphan status.py router)
  models/              # ORM models: feeding.py (Schedule+Log), status.py
frontend/              # Angular 22 standalone app
  src/app/
    components/feeding-schedule/   # Only component so far
    services/feeding.ts             # uses @Service() (Angular 22 pattern)
  proxy.conf.json                  # /api → localhost:8000
  .prettierrc                      # singleQuote, printWidth 100
```

## Key facts

- **Hardware layer** (`hardware/dispenser.py`, `hardware/sensors.py`) is stub-only. Look for `[STUB]` and `TODO`.
- **`hardware/status.py`** is dead code — a duplicate API router never imported anywhere.
- **DB file** `foodpilot.db` created at runtime in working directory. `init_db()` uses explicit model imports with `# noqa: F401`.
- **Backend has no tests, linter, or type checker** configured.
- **Frontend style**: standalone components, SCSS, routes are empty (no navigation yet).
- **Dev workflow**: run backend (port 8000) and frontend proxy (port 4200) in parallel. The proxy forwards `/api` calls.
- **Production build**: `ng build` → output in `frontend/dist/frontend/browser/` → must be copied to `backend/static/` for FastAPI to serve.
- **`deploy.sh`** does not exist yet. Deployment is `ng build && rsync && systemctl restart foodpilot` per `docs/Architecture.md`.
- **Raspberry Pi**: hostname `Pi-FoodPilot`, OS is Raspberry Pi OS Lite 64-bit.

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
| GET | `/` | root (JSON or Angular SPA if `backend/static/` exists) |
