from typing import Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.app.models.contact import Contact
from backend.app.models.company import Company
from backend.app.models.event import EventLog
from backend.app.models.score_history import ScoreAuditLog
from backend.app.core.config import get_settings

EVENT_SCORE_RULES = {
    "pageview": 2,
    "heartbeat": 1,
    "click": 5,
    "high_intent_view": 25,     # /pricing, /demo, /contact
    "form_submit": 45,          # Lead capture form
    "lemlist_open": 2,
    "lemlist_click": 15,
    "lemlist_reply": 40,
    "meeting_booked": 70,
}

class ScoringEngine:
    def __init__(self):
        self.settings = get_settings()

    def get_points_for_event(self, event_type: str, path: Optional[str] = None) -> int:
        if path and any(k in path.lower() for k in ["pricing", "demo", "quote", "book"]):
            return EVENT_SCORE_RULES["high_intent_view"]
        return EVENT_SCORE_RULES.get(event_type, 2)

    async def apply_event_score(
        self,
        db: AsyncSession,
        event_type: str,
        path: Optional[str],
        contact: Optional[Contact],
        company: Optional[Company]
    ) -> Tuple[int, Optional[int], Optional[int]]:
        """
        Updates Contact Score and Company Account Score based on incoming event.
        Returns: (points_awarded, new_contact_score, new_company_score)
        """
        points = self.get_points_for_event(event_type, path)
        now = datetime.utcnow()

        new_contact_score = None
        new_company_score = None

        # 1. Update Contact Score
        if contact:
            prev_score = contact.score
            contact.score += points
            contact.last_active_at = now
            if contact.score >= self.settings.HOT_LEAD_THRESHOLD:
                contact.engagement_status = "hot"
            elif contact.score >= 25:
                contact.engagement_status = "warm"

            # Log audit
            audit = ScoreAuditLog(
                entity_type="contact",
                entity_id=contact.id,
                previous_score=prev_score,
                point_delta=points,
                new_score=contact.score,
                reason=f"Event: {event_type} on {path or '/'}"
            )
            db.add(audit)
            new_contact_score = contact.score

        # 2. Update Company Intent & Total Score (with Buying Committee Aggregation)
        if company:
            prev_comp_score = company.total_score
            company.intent_score += points
            company.last_activity_at = now

            # Calculate Buying Committee Multiplier: Count distinct active contacts for this company
            active_contacts_stmt = select(func.count(Contact.id)).where(
                Contact.company_id == company.id,
                Contact.score > 0
            )
            res = await db.execute(active_contacts_stmt)
            active_contact_count = res.scalar() or 1

            committee_multiplier = 1.0
            if active_contact_count == 2:
                committee_multiplier = 1.4
            elif active_contact_count >= 3:
                committee_multiplier = 1.8

            company.total_score = int(company.fit_score + (company.intent_score * committee_multiplier))

            if company.total_score >= self.settings.HOT_ACCOUNT_THRESHOLD:
                company.tier = "hot"
            elif company.total_score >= 50:
                company.tier = "high"
            elif company.total_score >= 20:
                company.tier = "medium"
            else:
                company.tier = "low"

            audit_comp = ScoreAuditLog(
                entity_type="company",
                entity_id=company.id,
                previous_score=prev_comp_score,
                point_delta=company.total_score - prev_comp_score,
                new_score=company.total_score,
                reason=f"Account rollup from {event_type} (active contacts: {active_contact_count})"
            )
            db.add(audit_comp)
            new_company_score = company.total_score

        await db.flush()
        return points, new_contact_score, new_company_score

    async def run_time_decay_job(self, db: AsyncSession) -> int:
        """
        Applies time-decay to contacts and accounts inactive for more than INACTIVITY_DECAY_DAYS.
        Reduces scores by DAILY_DECAY_PERCENT.
        """
        threshold_date = datetime.utcnow() - timedelta(days=self.settings.INACTIVITY_DECAY_DAYS)
        
        # Decay inactive contacts
        stmt = select(Contact).where(
            Contact.last_active_at < threshold_date,
            Contact.score > 0
        )
        res = await db.execute(stmt)
        contacts = res.scalars().all()
        updated_count = 0

        for contact in contacts:
            decay_pts = max(1, int(contact.score * self.settings.DAILY_DECAY_PERCENT))
            prev = contact.score
            contact.score = max(0, contact.score - decay_pts)
            if contact.score < 25:
                contact.engagement_status = "cold"

            db.add(ScoreAuditLog(
                entity_type="contact",
                entity_id=contact.id,
                previous_score=prev,
                point_delta=-decay_pts,
                new_score=contact.score,
                reason="Inactivity time decay"
            ))
            updated_count += 1

        await db.commit()
        return updated_count
