from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.schemas.track import BatchTrackRequest, TrackResponse
from backend.app.services.identity_service import IdentityService
from backend.app.services.ip_resolver import IPResolverService
from backend.app.services.scoring_engine import ScoringEngine
from backend.app.services.alert_service import AlertService
from backend.app.models.event import EventLog
from backend.app.core.config import get_settings

router = APIRouter(prefix="/track", tags=["Tracking"])

identity_service = IdentityService()
ip_resolver_service = IPResolverService()
scoring_engine = ScoringEngine()
alert_service = AlertService()
settings = get_settings()

@router.post("", response_model=TrackResponse)
async def ingest_tracking_events(
    payload: BatchTrackRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Extract client IP
    client_ip = (
        request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or request.client.host
    )

    last_contact = None
    last_company = None
    last_contact_score = None
    last_company_score = None
    alert_triggered = False

    for event_data in payload.events:
        # 1. Resolve Identity (Check query params / cookie / email)
        contact, company = await identity_service.resolve_identity(db, event_data.identity)

        # 2. If company is still unknown, attempt Reverse-IP lookup
        if not company and client_ip:
            ip_info = await ip_resolver_service.resolve_ip(client_ip)
            if ip_info and ip_info.get("domain"):
                company = await identity_service.get_or_create_company(
                    db, domain=ip_info["domain"], name=ip_info.get("company_name")
                )

        # 3. Apply Scoring
        points, new_contact_score, new_company_score = await scoring_engine.apply_event_score(
            db=db,
            event_type=event_data.eventType,
            path=event_data.path,
            contact=contact,
            company=company
        )

        # 4. Log Event
        event_log = EventLog(
            event_id=event_data.eventId,
            event_type=event_data.eventType,
            visitor_id=event_data.identity.visitorId,
            contact_id=contact.id if contact else None,
            company_id=company.id if company else None,
            url=event_data.url,
            path=event_data.path,
            referrer=event_data.referrer,
            ip_address=client_ip,
            points_awarded=points,
            metadata_json=event_data.metadata
        )
        db.add(event_log)

        # 5. Check Alert Trigger
        is_hot_lead = (contact and contact.score >= settings.HOT_LEAD_THRESHOLD)
        is_hot_company = (company and company.total_score >= settings.HOT_ACCOUNT_THRESHOLD)
        
        if (is_hot_lead or is_hot_company) and not alert_triggered:
            await alert_service.notify_hot_lead(
                contact=contact,
                company=company,
                trigger_event=event_data.eventType,
                path=event_data.path
            )
            alert_triggered = True

        last_contact = contact
        last_company = company
        last_contact_score = new_contact_score
        last_company_score = new_company_score

    await db.commit()

    return TrackResponse(
        status="success",
        processed_events=len(payload.events),
        matched_contact_id=last_contact.id if last_contact else None,
        matched_company_domain=last_company.domain if last_company else None,
        new_contact_score=last_contact_score,
        new_company_score=last_company_score,
        alert_triggered=alert_triggered
    )
