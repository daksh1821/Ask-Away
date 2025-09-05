from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
import uvicorn

from .config import settings
from .database import engine, Base
from .routes import auth as auth_router, questions as q_router, answers as answers_router
from .routes import ai as ai_router, integrations as integrations_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create tables at startup (safe with SQLAlchemy)
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Error creating database tables: {e}")
    raise

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A comprehensive Q&A platform API with AI Summarization & Integrations built with FastAPI",
    docs_url=settings.DOCS_URL,
    redoc_url=settings.REDOC_URL,
    debug=settings.DEBUG
)

# Add security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure this properly in production
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

# Root endpoint
@app.get("/")
async def read_root():
    """Welcome message"""
    return {
        "message": f"Welcome to {settings.APP_NAME}!",
        "version": settings.APP_VERSION,
        "features": {
            "ai_summarization": bool(settings.OPENAI_API_KEY),
            "slack_integration": bool(settings.SLACK_BOT_TOKEN),
            "aws_integration": bool(settings.AWS_ACCESS_KEY_ID),
            "google_oauth": bool(settings.GOOGLE_CLIENT_ID)
        }
        "docs_url": settings.DOCS_URL,
        "redoc_url": settings.REDOC_URL
    }

# Include routers with API prefix
app.include_router(
    auth_router.router, 
        "features": [
            "AI-powered question summarization",
            "Google OAuth integration",
            "Slack notifications",
            "AWS S3 backup & CloudWatch metrics",
            "Real-time analytics"
        ]
    prefix=settings.API_PREFIX,
    tags=["authentication"]
        "message": f"Welcome to {settings.APP_NAME} with AI Summarization & Integrations!",
app.include_router(
    q_router.router, 
    prefix=settings.API_PREFIX,
    tags=["questions"]
)
app.include_router(
    answers_router.router, 
    prefix=settings.API_PREFIX,
    tags=["answers"]
)
app.include_router(
    ai_router.router,
    prefix=settings.API_PREFIX,
    tags=["ai"]
)
app.include_router(
    integrations_router.router,
    prefix=settings.API_PREFIX,
    tags=["integrations"]
)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"Database: {settings.DATABASE_URL}")
    logger.info(f"CORS origins: {settings.CORS_ORIGINS}")
    logger.info(f"AI Summarization: {'Enabled' if settings.OPENAI_API_KEY else 'Disabled'}")
    logger.info(f"Slack Integration: {'Enabled' if settings.SLACK_BOT_TOKEN else 'Disabled'}")
    logger.info(f"AWS Integration: {'Enabled' if settings.AWS_ACCESS_KEY_ID else 'Disabled'}")
    logger.info(f"Google OAuth: {'Enabled' if settings.GOOGLE_CLIENT_ID else 'Disabled'}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info(f"Shutting down {settings.APP_NAME}")

# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )