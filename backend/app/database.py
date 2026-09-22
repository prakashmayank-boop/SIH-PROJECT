import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(DATABASE_DIR, "ufis_floodsense.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DB_FILE}")

# Ensure directory exists if SQLite
if DATABASE_URL.startswith("sqlite"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    db_folder = os.path.dirname(db_path)
    if db_folder and not os.path.exists(db_folder):
        os.makedirs(db_folder, exist_ok=True)
    engine_kwargs = {"connect_args": {"check_same_thread": False}, "pool_pre_ping": True}
else:
    # PostgreSQL / MySQL connection pool settings
    engine_kwargs = {
        "pool_pre_ping": True,
        "pool_size": int(os.environ.get("DB_POOL_SIZE", "10")),
        "max_overflow": int(os.environ.get("DB_MAX_OVERFLOW", "20")),
        "pool_recycle": int(os.environ.get("DB_POOL_RECYCLE", "300")),
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
