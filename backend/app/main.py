from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.logging_config import setup_logging, logger
from backend.app.services.seeder import seed_database
from backend.app.routers import forecast, drainage, routing, alerts, tasks, sensors, replay, auth, ml, citizen

# Initialize structured logging
setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database is initialized & seeded
    logger.info("Initializing UFIS application...")
    seed_database()
    logger.info("UFIS application startup complete.")
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Dynamic Urban Flood Nowcasting and Decision-Support System (SIH 2026)",
    lifespan=lifespan
)

# Enable CORS — allow all origins for SIH demo deployment.
# JWT tokens are stored in localStorage (not cookies), so allow_credentials=False
# is safe and compatible with allow_origins=["*"].
# For strict production: replace ["*"] with specific Vercel domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact system administrator."}
    )

# Mount routers
app.include_router(auth.router)
app.include_router(forecast.router)
app.include_router(drainage.router)
app.include_router(routing.router)
app.include_router(alerts.router)
app.include_router(tasks.router)
app.include_router(sensors.router)
app.include_router(replay.router)
app.include_router(ml.router)
app.include_router(citizen.router)


from backend.app.services.dem_service import dem_service

@app.get("/")
def health_check():
    return {
        "status": "online",
        "system": "UFIS - UrbanFlood Intelligence System",
        "version": settings.VERSION,
        "pilot_area": settings.PILOT_NAME,
        "dem": dem_service.get_stats(),
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

