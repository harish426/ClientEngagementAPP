from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import get_settings
from backend.app.core.database import engine
from backend.app.models.base import Base
from backend.app.api.v1.router import api_v1_router

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print(f"🚀 Started B2B Lead Scoring Engine in [{settings.APP_ENV.upper()}] environment on port {settings.PORT}")
    yield
    await engine.dispose()

def create_app() -> FastAPI:
    app = FastAPI(
        title="B2B Intent & Lead Scoring Engine",
        version="1.0.0",
        description="High-throughput Tracking, Identity Resolution, Account Scoring & Alerting Engine",
        lifespan=lifespan
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS != ["*"] else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API v1
    app.include_router(api_v1_router)

    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "environment": settings.APP_ENV,
            "version": "1.0.0"
        }

    return app

app = create_app()
