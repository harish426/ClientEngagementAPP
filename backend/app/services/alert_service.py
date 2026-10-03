from typing import Optional
import httpx
from backend.app.models.contact import Contact
from backend.app.models.company import Company
from backend.app.core.config import get_settings

class AlertService:
    def __init__(self):
        self.settings = get_settings()

    async def notify_hot_lead(
        self,
        contact: Optional[Contact],
        company: Optional[Company],
        trigger_event: str,
        path: Optional[str]
    ) -> bool:
        """
        Sends an instant alert to Slack or your webhook when a prospect hits the HOT threshold.
        """
        if not self.settings.SLACK_WEBHOOK_URL or "mock" in self.settings.SLACK_WEBHOOK_URL:
            # In local dev / test, print formatted log
            print(f"\n🔥🔥🔥 [HOT LEAD NOTIFICATION TRIGGERED] 🔥🔥🔥")
            print(f"Lead: {contact.email if contact else 'Anonymous'}")
            print(f"Company: {company.name if company else 'Unknown'} ({company.domain if company else 'N/A'})")
            print(f"Lead Score: {contact.score if contact else 0} | Company Score: {company.total_score if company else 0}")
            print(f"Action: Triggered by {trigger_event} on {path}")
            print("="*60 + "\n")
            return True

        # Send to real Slack Webhook in Staging / Prod
        try:
            lead_name = f"{contact.first_name or ''} {contact.last_name or ''}".strip() if contact else "Visitor"
            contact_email = contact.email if contact else "N/A"
            company_name = company.name if company else (company.domain if company else "N/A")
            linkedin_link = contact.linkedin_url if (contact and contact.linkedin_url) else "N/A"

            slack_payload = {
                "text": f"🔥 *HOT B2B Lead Alert!* {contact_email} is actively engaging on your site!",
                "blocks": [
                    {
                        "type": "header",
                        "text": {"type": "plain_text", "text": "🔥 High-Intent Lead Detected!"}
                    },
                    {
                        "type": "section",
                        "fields": [
                            {"type": "mrkdwn", "text": f"*Contact:* {lead_name}\n*Email:* {contact_email}"},
                            {"type": "mrkdwn", "text": f"*Company:* {company_name}\n*Account Score:* {company.total_score if company else 0}/100"},
                            {"type": "mrkdwn", "text": f"*Lead Score:* {contact.score if contact else 0}/100"},
                            {"type": "mrkdwn", "text": f"*Trigger Action:* `{trigger_event}` on `{path}`"}
                        ]
                    },
                    {
                        "type": "context",
                        "elements": [
                            {"type": "mrkdwn", "text": f"LinkedIn: {linkedin_link} | *Action item: Reach out now!*"}
                        ]
                    }
                ]
            }

            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.post(self.settings.SLACK_WEBHOOK_URL, json=slack_payload)
                return resp.status_code == 200
        except Exception as e:
            print(f"Failed to deliver Slack alert: {e}")
            return False
