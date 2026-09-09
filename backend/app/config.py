import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "UFIS - UrbanFlood Intelligence System"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEFAULT_TENANT_ID: str = "t-bbmp-blr-01"
    DEFAULT_CITY_ID: str = "c-blr-01"
    DEFAULT_ZONE_ID: str = "z-koramangala-151"
    PILOT_NAME: str = "Bengaluru - Ward 151 (Koramangala)"
    CENTER_LAT: float = 12.9345
    CENTER_LON: float = 77.6265

settings = Settings()
