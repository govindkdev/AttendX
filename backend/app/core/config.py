import os
from pathlib import Path
from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
BASE_DIR = BACKEND_DIR.parent
DEFAULT_DB_PATH = (BACKEND_DIR / "attendx.db").resolve().as_posix()

class Settings(BaseSettings):
    # App Identity
    APP_NAME: str = "AttendX"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False

    # Institute Information
    INSTITUTE_NAME: str = "GCRG Group of Institutions"
    INSTITUTE_LOCATION: str = "Lucknow, Uttar Pradesh, India"
    INSTITUTE_TIMEZONE: str = "Asia/Kolkata"

    # Security & JWT
    APP_SECRET_KEY: str = Field(default="attendx_super_secret_development_app_key_32_bytes_min")
    JWT_SECRET_KEY: str = Field(default="attendx_jwt_secret_development_key_32_bytes_min")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours session
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS & Origins
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    BACKEND_PUBLIC_URL: str = "http://localhost:8000"

    @property
    def cors_origins(self) -> List[str]:
        origins = [self.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"]
        if self.DEBUG:
            origins.extend(["http://localhost:3000", "http://localhost:8000"])
        return list(set(origins))

    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DEFAULT_DB_PATH}"

    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("sqlite:///") and not url.startswith("sqlite+aiosqlite:///"):
            url = url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        return url

    # Initial Administrator Provisioning Settings
    INITIAL_ADMIN_ID: str = "ADM-001"
    INITIAL_ADMIN_NAME: str = "Govind Kushwaha"
    INITIAL_ADMIN_EMAIL: str = "admin@gcrg.edu.in"
    INITIAL_ADMIN_PASSWORD: Optional[str] = None

    # Geofence & GPS Defaults
    INSTITUTE_LATITUDE: float = 26.8467
    INSTITUTE_LONGITUDE: float = 80.9462
    GEOFENCE_RADIUS_METERS: float = 200.0
    GEOFENCE_ACCURACY_THRESHOLD: float = 50.0

    # Face Recognition & Storage
    STORAGE_DIR: str = str(BASE_DIR / "storage")
    UPLOAD_DIR: str = str(BASE_DIR / "storage" / "uploads")
    FACE_MODEL_DIR: str = str(BASE_DIR / "storage" / "models")
    INSIGHTFACE_MODEL_NAME: str = "buffalo_l"
    FACE_SIMILARITY_THRESHOLD: float = 0.48  # ArcFace 512-d cosine similarity threshold
    FACE_AMBIGUITY_MARGIN: float = 0.08      # Ambiguity margin between top-1 and top-2 candidate
    PAD_MODEL_PATH: str = str((BACKEND_DIR / "storage" / "models" / "anti_spoof.onnx").resolve())
    PAD_THRESHOLD: float = 0.65              # MiniFASNet live class confidence threshold
    FACE_DET_CONFIDENCE: float = 0.65        # RetinaFace detection confidence threshold
    FACE_MULTI_FRAME_SIMILARITY: float = 0.82 # Minimum cosine similarity between multi-frame captures

    # Email & SMS Providers
    EMAIL_PROVIDER: str = "mock"  # mock, smtp
    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USERNAME: Optional[str] = None
    EMAIL_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "notifications@gcrg.edu.in"

    SMS_PROVIDER: str = "mock"  # mock, twilio, fast2sms
    SMS_API_KEY: Optional[str] = None
    SMS_SENDER_ID: str = "ATTNDX"

    # AI Provider
    AI_PROVIDER: str = "rule_based"  # rule_based, gemini, openai
    AI_API_KEY: Optional[str] = None
    AI_MODEL: str = "gemini-1.5-flash"

    # Attendance defaults
    LATE_THRESHOLD_MINUTES: int = 15
    QR_EXPIRY_MINUTES: int = 30
    FACE_SESSION_MINUTES: int = 5

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure required storage directories exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.FACE_MODEL_DIR, exist_ok=True)
os.makedirs(Path(settings.PAD_MODEL_PATH).parent, exist_ok=True)
