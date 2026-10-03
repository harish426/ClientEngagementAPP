from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.models.contact import Contact
from backend.app.models.company import Company
from backend.app.services.scoring_engine import ScoringEngine

router = APIRouter(prefix="/leads", tags=["Leads & Scoring"])
scoring_engine = ScoringEngine()

@router.get("/hot")
async def get_hot_leads(
    min_score: int = 50,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all high-intent contacts ordered by score"""
    stmt = (
        select(Contact)
        .where(Contact.score >= min_score)
        .order_by(desc(Contact.score))
        .limit(limit)
    )
    res = await db.execute(stmt)
    contacts = res.scalars().all()

    return [
        {
            "id": c.id,
            "email": c.email,
            "first_name": c.first_name,
            "last_name": c.last_name,
            "score": c.score,
            "engagement_status": c.engagement_status,
            "company_id": c.company_id,
            "last_active_at": c.last_active_at,
            "lemlist_lead_id": c.lemlist_lead_id
        }
        for c in contacts
    ]

@router.get("/companies/hot")
async def get_hot_companies(
    min_score: int = 50,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve target accounts with highest engagement scores"""
    stmt = (
        select(Company)
        .where(Company.total_score >= min_score)
        .order_by(desc(Company.total_score))
        .limit(limit)
    )
    res = await db.execute(stmt)
    companies = res.scalars().all()

    return [
        {
            "id": comp.id,
            "domain": comp.domain,
            "name": comp.name,
            "fit_score": comp.fit_score,
            "intent_score": comp.intent_score,
            "total_score": comp.total_score,
            "tier": comp.tier,
            "last_activity_at": comp.last_activity_at
        }
        for comp in companies
    ]

@router.post("/decay/run")
async def trigger_decay_runner(db: AsyncSession = Depends(get_db)):
    """Run nightly decay calculation on inactive leads"""
    updated = await scoring_engine.run_time_decay_job(db)
    return {"status": "success", "decayed_contacts_count": updated}
