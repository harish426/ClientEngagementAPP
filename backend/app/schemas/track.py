from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class IdentityPayload(BaseModel):
    visitorId: str
    email: Optional[str] = None
    companyDomain: Optional[str] = None
    companyName: Optional[str] = None
    campaignLeadId: Optional[str] = None
    lemlistCampaignId: Optional[str] = None
    utmSource: Optional[str] = None
    utmMedium: Optional[str] = None
    utmCampaign: Optional[str] = None
    utmContent: Optional[str] = None
    utmTerm: Optional[str] = None

class SingleEventPayload(BaseModel):
    eventId: str
    eventType: str
    timestamp: str
    identity: IdentityPayload
    url: str
    path: str
    referrer: Optional[str] = ""
    title: Optional[str] = ""
    screenResolution: Optional[str] = ""
    timeOnPageSeconds: Optional[int] = 0
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class BatchTrackRequest(BaseModel):
    events: List[SingleEventPayload]

class TrackResponse(BaseModel):
    status: str
    processed_events: int
    matched_contact_id: Optional[int] = None
    matched_company_domain: Optional[str] = None
    new_contact_score: Optional[int] = None
    new_company_score: Optional[int] = None
    alert_triggered: bool = False
