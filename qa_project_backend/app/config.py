from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Optional
import json
import os

class Settings(BaseSettings):
    # Application
    APP_NAME: str = Field(default="Q&A Platform API", env="APP_NAME")
    APP_VERSION: str = Field(default="1.0.0", env="APP_VERSION")
    DEBUG: bool = Field(default=False, env="DEBUG")
    
    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DATABASE_ECHO: bool = Field(default=False, env="DATABASE_ECHO")
    
    # CORS - Handle both string and list formats
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://127.0.0.1:5173"],
        env="CORS_ORIGINS"
    )
    
    # For backward compatibility with BACKEND_ORIGINS
    BACKEND_ORIGINS: Optional[List[str]] = Field(default=None, env="BACKEND_ORIGINS")
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = Field(default="", env="GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = Field(default="", env="GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = Field(default="http://localhost:8000/api/auth/google/callback", env="GOOGLE_REDIRECT_URI")
    
    # Slack Integration
    SLACK_BOT_TOKEN: str = Field(default="", env="SLACK_BOT_TOKEN")
    SLACK_SIGNING_SECRET: str = Field(default="", env="SLACK_SIGNING_SECRET")
    SLACK_WEBHOOK_URL: str = Field(default="", env="SLACK_WEBHOOK_URL")
    
    # OpenAI for AI Summarization
    OPENAI_API_KEY: str = Field(default="", env="OPENAI_API_KEY")
    
    # AWS Configuration
    AWS_ACCESS_KEY_ID: str = Field(default="", env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str = Field(default="", env="AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = Field(default="us-east-1", env="AWS_REGION")
    AWS_S3_BUCKET: str = Field(default="", env="AWS_S3_BUCKET")
    
    # Redis for caching
    REDIS_URL: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # Email Configuration
    SMTP_HOST: str = Field(default="smtp.gmail.com", env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USER: str = Field(default="", env="SMTP_USER")
    SMTP_PASSWORD: str = Field(default="", env="SMTP_PASSWORD")
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_WINDOW: int = Field(default=3600, env="RATE_LIMIT_WINDOW")
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = Field(default=20, env="DEFAULT_PAGE_SIZE")
    MAX_PAGE_SIZE: int = Field(default=100, env="MAX_PAGE_SIZE")
    
    # Search
    SEARCH_RESULTS_LIMIT: int = Field(default=50, env="SEARCH_RESULTS_LIMIT")
    
    # API Configuration
    API_PREFIX: str = Field(default="/api", env="API_PREFIX")
    DOCS_URL: str = Field(default="/docs", env="DOCS_URL")
    REDOC_URL: str = Field(default="/redoc", env="REDOC_URL")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        
        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str):
            if field_name in ('CORS_ORIGINS', 'BACKEND_ORIGINS'):
                # Handle JSON array strings
                if raw_val.startswith('[') and raw_val.endswith(']'):
                    try:
                        return json.loads(raw_val)
                    except json.JSONDecodeError:
                        # Fallback to comma-separated values
                        return [url.strip().strip('"\'') for url in raw_val.strip('[]').split(',')]
                # Handle comma-separated values
                elif ',' in raw_val:
                    return [url.strip().strip('"\'') for url in raw_val.split(',')]
                else:
                    return [raw_val.strip().strip('"\'')]
            return cls.json_loads(raw_val)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Use BACKEND_ORIGINS if CORS_ORIGINS is not set and BACKEND_ORIGINS is available
        if self.BACKEND_ORIGINS and not kwargs.get('CORS_ORIGINS'):
            self.CORS_ORIGINS = self.BACKEND_ORIGINS

# Create settings instance
settings = Settings()

# Validation
def validate_settings():
    """Validate critical settings"""
    if not settings.SECRET_KEY:
        raise ValueError("SECRET_KEY is required")
    
    if len(settings.SECRET_KEY) < 32:
        print("WARNING: SECRET_KEY should be at least 32 characters long for better security")
    
    if not settings.DATABASE_URL:
        raise ValueError("DATABASE_URL is required")
    
    return True

# Initialize validation
validate_settings()