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
# from repo root
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
# or from backend/ (note: no `backend.` prefix)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be accessible at `http://localhost:8000`.

- Interactive API docs (Swagger UI): `http://localhost:8000/docs`
- OpenAPI schema: `http://localhost:8000/openapi.json`

## What happens on startup

- `init_db()` runs on import and creates the SQLite file `foodpilot.db` in the **current working directory** (so running from `backend/` vs. the repo root will place the DB in different locations).
- If `backend/static/` exists, FastAPI mounts it at `/` and serves the Angular SPA. Otherwise `GET /` returns a JSON placeholder.

## API Endpoints

See the API table in [AGENTS.md](../AGENTS.md). All routes are under `/api/`.

## Tests / Lint / Typecheck

None configured. Add a framework (e.g. `pytest`, `ruff`, `mypy`) before introducing backend tests.
