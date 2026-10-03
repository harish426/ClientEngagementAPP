from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
from backend.app.core.database import get_db
from backend.app.services.identity_service import IdentityService
from backend.app.services.scoring_engine import ScoringEngine
from backend.app.services.alert_service import AlertService
from backend.app.schemas.track import IdentityPayload
from backend.app.models.event import EventLog

router = APIRouter(prefix="/webhooks/lemlist", tags=["Lemlist Webhooks"])

identity_service = IdentityService()
scoring_engine = ScoringEngine()
alert_service = AlertService()

LEMLIST_EVENT_TYPE_MAPPING = {
    "emailsOpened": "lemlist_open",
    "emailsClicked": "lemlist_click",
    "emailsReplied": "lemlist_reply",
    "emailsBounced": "email_bounced",
    "emailsUnsubscribed": "lemlist_unsubscribed",
}

@router.post("")
async def handle_lemlist_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    try:
        body: Dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type_raw = body.get("type") or body.get("event") or ""
    mapped_event = LEMLIST_EVENT_TYPE_MAPPING.get(event_type_raw, "custom")

    lead_email = body.get("leadEmail") or body.get("email")
    lead_id = body.get("leadId") or body.get("_id")
    company_name = body.get("companyName")

    if not lead_email:
        return {"status": "ignored", "reason": "No email in payload"}

    # Resolve Contact and Company
    identity = IdentityPayload(
        visitorId=f"lemlist_{lead_id or 'anon'}",
        email=lead_email,
        companyName=company_name,
        campaignLeadId=lead_id
    )

    contact, company = await identity_service.resolve_identity(db, identity)

    # Score event
    points, new_contact_score, new_company_score = await scoring_engine.apply_event_score(
        db=db,
        event_type=mapped_event,
        path=None,
        contact=contact,
        company=company
    )

    # Record event log
    event_log = EventLog(
        event_id=f"lem_{body.get('id', '')}_{lead_id}_{mapped_event}",
        event_type=mapped_event,
        visitor_id=identity.visitorId,
        contact_id=contact.id if contact else None,
        company_id=company.id if company else None,
        points_awarded=points,
        metadata_json=body
    )
    db.add(event_log)

    # If lead replied or clicked, check if hot
    if mapped_event in ["lemlist_reply", "lemlist_click"] and contact and contact.score >= 50:
        await alert_service.notify_hot_lead(
            contact=contact,
            company=company,
            trigger_event=f"Lemlist {event_type_raw}",
            path=None
        )

    await db.commit()

    return {
        "status": "success",
        "event": mapped_event,
        "contact_score": new_contact_score,
        "company_score": new_company_score
    }
