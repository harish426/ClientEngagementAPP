import os
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

def get_env_file() -> str:
    env_name = os.getenv("APP_ENV", "development").lower()
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    env_file = os.path.join(base_dir, "env", f".env.{env_name}")
    if os.path.exists(env_file):
        return env_file
    return os.path.join(base_dir, "env", ".env.development")

class Settings(BaseSettings):
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: List[str] = ["*"]

    DATABASE_URL: str = "sqlite+aiosqlite:///./dev_analytics.db"

    HOT_LEAD_THRESHOLD: int = 70
    HOT_ACCOUNT_THRESHOLD: int = 100
    INACTIVITY_DECAY_DAYS: int = 14
    DAILY_DECAY_PERCENT: float = 0.05

    IPINFO_API_TOKEN: str = ""
    SLACK_WEBHOOK_URL: str = ""
    LEMLIST_API_KEY: str = ""
    APOLLO_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=get_env_file(),
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()
