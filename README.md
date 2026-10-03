# ClientEngagementAPP - B2B Client Engagement & Account Scoring Engine

> A modular, production-ready B2B visitor tracking, identity stitching, and real-time account scoring engine designed to identify and prioritize high-intent prospects across Apollo.io, Lemlist, and your web application.

---

## 🏛 Architecture Overview

```
                               ┌───────────────────────────┐
                               │     APOLLO.IO SOURCING    │
                               │  Verified Leads & Company │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │   LEMLIST MULTI-CHANNEL   │
                               │ Email + LinkedIn Sequence │
                               │ (Dynamic Smart Links)     │
                               └─────────────┬─────────────┘
                                             │
                       Click Smart Link: `?email=...&company=...`
                                             │
                                             ▼
   ┌──────────────────────────────────────────────────────────────────────────────────┐
   │                   FRONTEND: `tracker.js` (TypeScript SDK)                        │
   │  • Persistent Visitor Cookie ID (`vid_...`)                                      │
   │  • URL Identity Stitching (`email`, `lead_id`, `company`)                        │
   │  • Auto SPA Route Change, Form Submit & High-Intent Click Observers              │
   │  • Resilient Beacon Transport (`navigator.sendBeacon` + keepalive fallback)      │
   └─────────────────────────────────────────┬────────────────────────────────────────┘
                                             │
                             HTTP Beacon POST `/api/v1/track`
                                             │
                                             ▼
   ┌──────────────────────────────────────────────────────────────────────────────────┐
   │                    BACKEND: FastAPI + SQLAlchemy Engine                          │
   │                                                                                  │
   │  1. Ingestion & Identity Service (Cookie ➔ Contact ➔ Company Resolution)        │
   │  2. Reverse-IP & B2B Enrichment (Filters ISPs, detects corporate domain)         │
   │  3. Real-Time Scoring Rules:                                                     │
   │     • Pageview: +2 pts | High-Intent (/pricing, /demo): +25 pts                  │
   │     • Form Submit: +45 pts | Lemlist Reply: +40 pts                              │
   │  4. Buying Committee Multiplier: (2 active contacts: 1.4x | 3+ contacts: 1.8x)   │
   │  5. Nightly Time-Decay Runner (Reduces stale scores over time)                   │
   └─────────────────────────────────────────┬────────────────────────────────────────┘
                                             │
                                  Lead Score >= 70 (HOT)
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │   INSTANT ALERT SERVICE   │
                               │  Slack / Webhook Alerts   │
                               │ "John Doe @ Acme is LIVE" │
                               └───────────────────────────┘
```

---

## 📁 Repository Structure

```
├── frontend/                     # TypeScript Tracker SDK
│   ├── src/
│   │   ├── types.ts              # SDK Type Definitions
│   │   ├── identity.ts           # Identity Resolution & Storage
│   │   ├── transport.ts          # Resilient sendBeacon / fetch transport
│   │   ├── events.ts             # Observers for SPA, Clicks & Forms
│   │   ├── tracker.ts            # Main B2BTracker SDK Controller
│   │   └── index.ts              # Browser IIFE & ESM Entrypoint
│   ├── config/
│   │   ├── .env.development
│   │   ├── .env.test
│   │   └── .env.production
│   ├── rollup.config.mjs         # Zero-dependency bundle builder
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                      # Python FastAPI Ingestion & Scoring Service
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py         # Multi-environment Pydantic settings
│   │   │   └── database.py       # Async SQLAlchemy database engine
│   │   ├── models/
│   │   │   ├── company.py        # Account entity & firmographic fit scores
│   │   │   ├── contact.py        # Contact entity & visitor cookie links
│   │   │   ├── event.py          # Activity logs (pageviews, clicks, forms)
│   │   │   └── score_history.py  # Score audit trails
│   │   ├── schemas/
│   │   │   └── track.py          # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── ip_resolver.py    # Reverse-IP & Corporate Domain Resolver
│   │   │   ├── identity_service.py # Identity Stitching & Account Mapping
│   │   │   ├── scoring_engine.py # Point calculation, multipliers & decay
│   │   │   └── alert_service.py  # Slack / Email alert dispatcher
│   │   ├── api/v1/
│   │   │   ├── track.py          # Beacon ingestion endpoint (/api/v1/track)
│   │   │   ├── leads.py          # Hot leads & accounts query APIs
│   │   │   ├── lemlist.py        # Lemlist webhook receiver
│   │   │   └── router.py         # Router aggregator
│   │   └── main.py               # FastAPI App & Lifespan handler
│   ├── env/
│   │   ├── .env.development
│   │   ├── .env.test
│   │   └── .env.production
│   ├── tests/                    # Async test suite
│   ├── requirements.txt
│   └── run.py                    # Multi-environment CLI runner
│
└── AUTOMATIONS.md                # Apollo + Lemlist Outreach Blueprint
```

---

## 🚀 Quick Start

### 1. Backend Setup (Python)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run in Development mode
python run.py --env development

# Run in Production mode
python run.py --env production
```

### 2. Frontend Tracker Setup (TypeScript)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build minified tracker bundle for production
npm run build:prod
```

### 3. Embedding `tracker.js` into your Web Application

Include the built script in your website's `<head>`:

```html
<script 
  src="https://your-cdn.com/tracker.min.js" 
  data-endpoint="https://api.yourcompany.com/api/v1/track"
  data-env="production">
</script>
```

Or import programmatically in React / Next.js:

```typescript
import { B2BTracker } from 'auto-apollo-lemlist-tracker';

const tracker = new B2BTracker({
  endpoint: 'https://api.yourcompany.com/api/v1/track',
  env: 'production',
  debug: false
});

tracker.init();
```

---

## 🧪 Running Automated Tests

```bash
pytest backend/tests -v
```
