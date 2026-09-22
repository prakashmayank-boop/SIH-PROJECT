import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "UFIS - UrbanFlood Intelligence System"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEFAULT_TENANT_ID: str = "t-bbmp-blr-01"
    DEFAULT_CITY_ID: str = "c-blr-01"
    DEFAULT_ZONE_ID: str = "z-koramangala-151"
    PILOT_NAME: str = "Bengaluru - Ward 151 (Koramangala)"
    CENTER_LAT: float = 12.9345
    CENTER_LON: float = 77.6265

    # Security
    JWT_SECRET_KEY: str = "ufis_sih_2026_jwt_secret_key_super_secure_change_in_prod"
    JWT_ALGORITHM: str = "HS256"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
