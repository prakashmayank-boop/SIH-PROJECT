import json
import logging
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("ufis.config")

class Settings(BaseSettings):
    # Application & Environment
    APP_NAME: str = "UFIS - UrbanFlood Intelligence System"
    VERSION: str = "1.0.0"
    ENV: str = "development"  # "development" | "staging" | "production"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Server Configuration (for uvicorn/container runner)
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 2

    # Database Configuration (Defaults to local SQLite if unset)
    DATABASE_URL: str = ""
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 300

    # Security & Authentication
    JWT_SECRET_KEY: str = "ufis_sih_2026_jwt_secret_key_super_secure_change_in_prod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS Allowed Origins
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:80",
        "http://127.0.0.1:80",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            # Support JSON array format: ["http://...", "https://..."]
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            # Support comma-separated format: http://...,https://...
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

    # Pilot Area / Tenant Configuration
    DEFAULT_TENANT_ID: str = "t-bbmp-blr-01"
    DEFAULT_CITY_ID: str = "c-blr-01"
    DEFAULT_ZONE_ID: str = "z-koramangala-151"
    PILOT_NAME: str = "Bengaluru - Ward 151 (Koramangala)"
    CENTER_LAT: float = 12.9345
    CENTER_LON: float = 77.6265

    # Demo Operator Credentials
    DEMO_EMAIL: str = "operator@bbmp.gov.in"
    DEMO_PASSWORD: str = "admin123"
    ENABLE_DEMO_LOGIN: bool = True

    # External Services & SMS Gateway
    MOCK_SMS_MODE: bool = True
    SMS_GATEWAY_API_KEY: str = ""
    SMS_SENDER_ID: str = "BBMP_UFIS"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # GIS / Weather Radar Data Source
    RADAR_SOURCE: str = "IMD_Bengaluru"

    # AWS Cloud Integration (S3, CloudWatch, etc.)
    AWS_REGION: str = "ap-south-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

