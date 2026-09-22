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

# Enable CORS with whitelist and local + Vercel regex
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$|^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
