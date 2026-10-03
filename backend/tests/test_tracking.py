import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["environment"] == "test"

@pytest.mark.asyncio
async def test_identity_stitching_and_scoring(client: AsyncClient):
    # Step 1: Prospect clicks Lemlist link with ?email=alex@acmecorp.com
    payload = {
        "events": [
            {
                "eventId": "evt_test_1",
                "eventType": "pageview",
                "timestamp": "2026-10-03T12:00:00Z",
                "identity": {
                    "visitorId": "vid_cookie_123",
                    "email": "alex@acmecorp.com",
                    "companyName": "Acme Corp",
                    "campaignLeadId": "lem_lead_99"
                },
                "url": "https://company.com/landing?email=alex@acmecorp.com",
                "path": "/landing"
            }
        ]
    }

    res = await client.post("/api/v1/track", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["matched_company_domain"] == "acmecorp.com"
    assert data["new_contact_score"] == 2 # 2 points for pageview

    # Step 2: Same user later views /pricing (High Intent) without passing email (using cookie vid_cookie_123)
    high_intent_payload = {
        "events": [
            {
                "eventId": "evt_test_2",
                "eventType": "high_intent_view",
                "timestamp": "2026-10-03T12:05:00Z",
                "identity": {
                    "visitorId": "vid_cookie_123" # No email passed! Cookie identity stitching test
                },
                "url": "https://company.com/pricing",
                "path": "/pricing"
            }
        ]
    }

    res2 = await client.post("/api/v1/track", json=high_intent_payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["matched_company_domain"] == "acmecorp.com"
    assert data2["new_contact_score"] == 27 # 2 + 25 = 27

@pytest.mark.asyncio
async def test_form_submission_and_hot_lead_trigger(client: AsyncClient):
    # Form submission awards 45 points + prior points triggers Hot Lead
    payload = {
        "events": [
            {
                "eventId": "evt_test_form",
                "eventType": "form_submit",
                "timestamp": "2026-10-03T12:10:00Z",
                "identity": {
                    "visitorId": "vid_cookie_456",
                    "email": "sarah@stripe.com",
                    "companyName": "Stripe"
                },
                "url": "https://company.com/demo",
                "path": "/demo"
            }
        ]
    }

    res = await client.post("/api/v1/track", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["new_contact_score"] == 45 # Form submit

    # Another high-intent action pushes over 70 hot lead threshold
    res2 = await client.post("/api/v1/track", json={
        "events": [
            {
                "eventId": "evt_test_form_2",
                "eventType": "high_intent_view",
                "timestamp": "2026-10-03T12:12:00Z",
                "identity": {"visitorId": "vid_cookie_456"},
                "url": "https://company.com/book",
                "path": "/book"
            }
        ]
    })
    assert res2.json()["new_contact_score"] == 70 # 45 + 25 = 70
    assert res2.json()["alert_triggered"] is True

@pytest.mark.asyncio
async def test_lemlist_webhook_ingestion(client: AsyncClient):
    webhook_payload = {
        "type": "emailsReplied",
        "email": "ceo@enterprise.com",
        "leadId": "lead_789",
        "companyName": "Enterprise Inc"
    }

    res = await client.post("/api/v1/webhooks/lemlist", json=webhook_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["event"] == "lemlist_reply"
    assert data["contact_score"] == 40
