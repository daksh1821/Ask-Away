# small config wrapper (use env vars)
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./qa.db"
    SECRET_KEY: str = "change-this-secret"   # overwrite in .env for prod
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60*24*7
    BACKEND_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    class Config:
        env_file = ".env"

settings = Settings()
