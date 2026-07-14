# Frontend Local Development Setup

## Prerequisites
- Node.js and npm
- Angular CLI (project-locally available via `npx`; globally optional)

## Setup Steps

Run from the `frontend/` directory:

```bash
npm install
ng serve
```

The application will be available at `http://localhost:4200/`.

- Add `--open` to `ng serve` to launch the browser automatically.
- The dev server uses `proxy.conf.json` to forward `/api/*` to `http://localhost:8000`, so the FastAPI backend must be running for API calls to work.

## Other Commands

All run from `frontend/`:

```bash
ng test        # unit tests (Vitest via @angular/build:unit-test)
ng build       # production build → frontend/dist/frontend/browser/
```

## App Structure

- Routes (`src/app/app.routes.ts`): `''` → feeding schedule (CRUD), `/status` → live status view, `/verlauf` → feeding history. Unknown paths redirect to `''`.
- Components use Angular 22 **signals** (`signal()`, `computed()`, `effect()`) for local state; the status view polls the backend every 10 seconds.
- Services in `src/app/services/` (`feeding`, `history`) wrap the REST API with `HttpClient` and translate errors to German user messages; `overlay` holds cross-component UI state (FAB visibility, last manual feeding).

## Production Build Path

`ng build` writes to `frontend/dist/frontend/browser/`. To serve the SPA from FastAPI, copy that directory's contents into `backend/static/`.
