from fastapi import APIRouter
from backend.app.api.v1.track import router as track_router
from backend.app.api.v1.leads import router as leads_router
from backend.app.api.v1.lemlist import router as lemlist_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(track_router)
api_v1_router.include_router(leads_router)
api_v1_router.include_router(lemlist_router)
