# FoodPilot – AGENTS.md

Compact orientation for future agent sessions. Full architecture lives in
[`docs/Architecture.md`](docs/Architecture.md). Local dev setup in
[`docs/Backend.md`](docs/Backend.md) and [`docs/Frontend.md`](docs/Frontend.md).
Pi-side deploy and ops in [`docs/Deployment.md`](docs/Deployment.md) and
[`docs/SystemdService.md`](docs/SystemdService.md).

## Setup

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

Backend deps: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `pydantic`,
`gpiozero`, `apscheduler`. No formatter, linter, type checker, or test
framework is configured for the backend — do not look for them.

## Run (local dev, two terminals)

```powershell
# terminal 1, from repo root
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
# or from backend/ (no `backend.` prefix):
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# terminal 2, from frontend/
npm install
npm start          # ng serve → http://localhost:4200, proxies /api → :8000
```

Tests: `npm test` from `frontend/` (Vitest via `@angular/build:unit-test`).

## Layout

```
backend/
  main.py              # FastAPI app; lifespan runs init_db() + starts scheduler; mounts /
  database.py          # SQLAlchemy engine + init_db() with explicit model imports
  scheduler.py         # APScheduler BackgroundScheduler + reload_scheduler()
  api/                 # Routers: feeding, status, history
  models/              # ORM models: base.py, feeding.py
  hardware/            # gpiozero GPIO with stub fallback — dispenser.py, sensors.py
frontend/
  src/app/
    app.ts / app.config.ts / app.routes.ts   # standalone root
    components/         # feed-now-fab, feeding-schedule, nav-bar, status, history
    services/           # feeding.ts, status.ts, history.ts, overlay.ts
                        # (Angular 22 @Service() decorator)
  proxy.conf.json       # /api → localhost:8000 (dev only)
deploy.ps1              # PowerShell: build + scp + pip + systemctl restart
```

## Gotchas (read before changing things)

- **`backend/static/` is gitignored** and starts empty. `ng build` writes to
  `frontend/dist/frontend/browser/` — never to `backend/static/`. To test the
  SPA locally, copy the build output: `Copy-Item frontend\dist\frontend\browser\* backend\static\ -Recurse -Force`.
  `deploy.ps1` does this for you.
- **`foodpilot.db` path is CWD-relative** (`sqlite:///./foodpilot.db` in
  `database.py`). Starting uvicorn from `backend/` vs. the repo root puts the
  DB in different places. Pick one CWD and stick with it.
- **`app.mount("/", StaticFiles(...))` must stay last** in `main.py` — it
  swallows every path the routers don't claim.
- **Hardware modules fall back to stubs off-Pi**: `dispenser.py` and
  `sensors.py` lazy-init gpiozero devices on first use; if no pin factory is
  available (Windows/dev) they log a warning once and stub out (no motor,
  sensor reads `True`). Don't init GPIO at import time — it would crash dev.
- **Schedule CRUD must call `reload_scheduler()`** after commit (all
  endpoints in `api/feeding.py` already do). Forgetting it means the DB and
  the running APScheduler jobs drift apart.
- **`init_db()` imports models with `# noqa: F401`** to register them on
  `Base.metadata`. New models must be added there too, or `create_all` won't
  see them. `init_db()` runs in the FastAPI lifespan, not at import.
- **`deploy.ps1` defaults to `pi@Pi-FoodPilot` and `~/foodpilot`** but the
  real Pi is `admin@Pi-FoodPilot` (see `docs/SystemdService.md`). Always pass
  `-PiUser admin` (and `-PiDir` if not `~/foodpilot`).
- **The Pi user needs a NOPASSWD sudo rule** for `systemctl restart
  foodpilot.service` or `deploy.ps1` fails (no TTY over SSH). Setup in
  `docs/Deployment.md` → Prerequisites.
- **PowerShell parse quirks**: the script uses `Invoke-Remote` for commands
  that should throw on failure and `Invoke-RemoteStream` for diagnostic
  output that should be visible. Don't mix them.
- **`.gitattributes` pins LF** for `*.sh`, `*.ps1`, `*.service` so Windows
  checkouts (where `core.autocrlf=true` is the default) don't break bash.
- **No CI**: there is no automated build, lint, or test on push. Verify
  manually before declaring done.

## API endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET    | `/api/feeding/` | list schedules |
| POST   | `/api/feeding/` | create schedule (reloads scheduler) |
| PUT    | `/api/feeding/{id}` | update schedule (reloads scheduler) |
| DELETE | `/api/feeding/{id}` | delete schedule (reloads scheduler) |
| POST   | `/api/feeding/trigger?size=medium` | manual feed (`small\|medium\|large`), verifies via flow sensor |
| GET    | `/api/history/` | feeding log, default limit 50, max 500 |
| GET    | `/` | JSON placeholder, or Angular SPA if `backend/static/index.html` exists |

Interactive docs at `http://localhost:8000/docs` when uvicorn is running.

## Hardware (BCM pin numbering)

| Pin | Device | Module |
|-----|--------|--------|
| 18  | Dispenser motor PWM | `hardware/dispenser.py` |
| 23  | Dispenser motor direction | `hardware/dispenser.py` |
| 24  | Food flow sensor (digital in) | `hardware/sensors.py` |

`SIZE_RUNTIME_SECONDS` in `dispenser.py` maps portion size to motor run-time
(small 10 s, medium 20 s, large 30 s). `trigger_feeding()` returns `False` if
the motor fails **or** no food falls past the flow sensor within the detection
window after motor start (motor is then stopped early).

## Deploy to Pi

`.\deploy.ps1` from repo root (PowerShell 7+). It builds the frontend,
copies the staged backend (venv + DB excluded) via `scp`, runs `pip install`
on the Pi, and `systemctl restart foodpilot.service`. First-time Pi setup
(systemd unit, venv, `visudo` NOPASSWD rule) is manual — see
`docs/Deployment.md` and `docs/SystemdService.md`. Pi: `Pi-FoodPilot`,
Raspberry Pi OS Lite 64-bit, SSH user `admin`.
