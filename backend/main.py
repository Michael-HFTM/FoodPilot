from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from database import init_db
from api import feeding, status, history

app = FastAPI(title="Foodpilot API")

# Create DB tables on startup
init_db()

# API routes
app.include_router(feeding.router, prefix="/api/feeding", tags=["feeding"])
app.include_router(status.router,  prefix="/api/status",  tags=["status"])
app.include_router(history.router, prefix="/api/history", tags=["history"])

# Serve Angular build (must be last)
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
else:
    @app.get("/")
    def root():
        return {"message": "Foodpilot API running. Frontend not deployed yet."}