# Backend Local Development Setup

## Prerequisites
- Python 3.8+
- pip/venv (virtual environment management)

## Virtual Environment

Follow [SetUpPythonVenv.md](SetUpPythonVenv.md) to create and activate the venv.

Then install the backend dependencies (the file lives in `backend/`):

```bash
pip install -r backend\requirements.txt
```

## Running the Server

Start FastAPI with uvicorn:

```bash
# or from backend/
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be accessible at `http://localhost:8000`.

- Interactive API docs (Swagger UI): `http://localhost:8000/docs`
- OpenAPI schema: `http://localhost:8000/openapi.json`

## What happens on startup

- The FastAPI **lifespan** (see `main.py`) runs `init_db()`, which creates the SQLite file `foodpilot.db` in the **current working directory** (so running from `backend/` vs. the repo root will place the DB in different locations).
- The lifespan then starts the APScheduler `BackgroundScheduler` and registers one cron job per enabled feeding schedule (`scheduler.py`). Jobs are re-registered after every schedule create/update/delete.
- If `backend/static/` exists, FastAPI mounts it at `/` and serves the Angular SPA. Otherwise `GET /` returns a JSON placeholder.
- On machines without GPIO (dev laptop), the hardware modules log a warning on first use and fall back to stubs — no motor runs, the flow sensor reads "food flowing".

## API Endpoints

All API routes are under `/api/`:

| Method | Path | Notes |
|--------|------|-------|
| GET    | `/api/feeding/` | list schedules |
| POST   | `/api/feeding/` | create schedule (reloads scheduler) |
| PUT    | `/api/feeding/{id}` | update schedule (reloads scheduler) |
| DELETE | `/api/feeding/{id}` | delete schedule (reloads scheduler) |
| POST   | `/api/feeding/trigger?size=medium` | manual feed (`small\|medium\|large`), verifies via flow sensor |
| GET    | `/api/history/` | feeding log, default limit 50, max 500 |
| GET    | `/` | JSON placeholder, or Angular SPA if `backend/static/index.html` exists |

## Tests / Lint / Typecheck

None configured. Add a framework (e.g. `pytest`, `ruff`, `mypy`) before introducing backend tests.
