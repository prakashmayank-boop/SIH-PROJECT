import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

DATABASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(DATABASE_DIR, "ufis_floodsense.db")
DATABASE_URL = settings.DATABASE_URL.strip() if settings.DATABASE_URL else f"sqlite:///{DB_FILE}"

# Ensure directory exists if SQLite
if DATABASE_URL.startswith("sqlite"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    db_folder = os.path.dirname(db_path)
    if db_folder and not os.path.exists(db_folder):
        os.makedirs(db_folder, exist_ok=True)
    engine_kwargs = {"connect_args": {"check_same_thread": False}, "pool_pre_ping": True}
else:
    # PostgreSQL (AWS RDS) / MySQL connection pool settings
    engine_kwargs = {
        "pool_pre_ping": True,
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_recycle": settings.DB_POOL_RECYCLE,
    }

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
