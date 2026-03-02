# CivicPulse – System Architecture

**"Your neighborhood's heartbeat"**

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CIVICPULSE ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐    ┌──────────────────────────────────────────────────────┐   │
│  │   Next.js    │    │                    SUPABASE                          │   │
│  │   Frontend   │◄──►│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │   │
│  │              │    │  │  PostgreSQL │ │    Auth     │ │     Storage     │ │   │
│  │  - Map       │    │  │  (issues,   │ │  (users)    │ │   (images)      │ │   │
│  │  - Report    │    │  │  verifs,    │ │             │ │                 │ │   │
│  │  - Dashboard │    │  │  users)     │ │             │ │                 │ │   │
│  └──────┬───────┘    │  └─────────────┘ └─────────────┘ └─────────────────┘ │   │
│         │            └──────────────────────────────────────────────────────┘   │
│         │                                                                       │
│         │            ┌──────────────────────────────────────────────────────┐   │
│         └───────────►│              NEXT.JS API ROUTES                       │   │
│                      │  - /api/issues     (CRUD)                             │   │
│                      │  - /api/verify     (confirm/reject)                    │   │
│                      │  - /api/ai         (classify image + text)             │   │
│                      │  - /api/priority   (recalculate scores)                │   │
│                      └──────────────────────────────────────────────────────┘   │
│                                         │                                        │
│                                         ▼                                        │
│                      ┌──────────────────────────────────────────────────────┐   │
│                      │              AI / INTELLIGENCE LAYER                  │   │
│                      │  - Image: Mock / Cloud Vision / TensorFlow.js         │   │
│                      │  - Text: NLP categorization (keyword + mock)          │   │
│                      │  - Priority: Rule-based scoring engine                │   │
│                      └──────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

EXTERNAL:
- Mapbox GL JS (maps, geocoding)
- Supabase Realtime (optional: live map updates)
```

---

## 2. Tech Stack Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Frontend** | Next.js 14 (App Router) + Tailwind | Fast, SEO, API routes co-located |
| **Database** | Supabase (PostgreSQL) | Relational queries for priority/aggregations, auth + storage bundled |
| **Maps** | Mapbox GL JS | Generous free tier, great React support |
| **AI** | Mock service + extensible interface | Hackathon: mock first; swap in Vision API / TF.js later |

---

## 3. Database Schema

### Core Tables

```
profiles (extends Supabase auth.users)
├── id (uuid, FK → auth.users)
├── display_name (text)
├── role (enum: citizen | authority | volunteer)
├── created_at, updated_at
└── avatar_url (text, optional)

issues
├── id (uuid, PK)
├── reporter_id (uuid, FK → profiles)
├── image_url (text)           -- Supabase Storage URL
├── description (text)
├── issue_type (enum: pothole | garbage | streetlight | water_leak | other)
├── severity (enum: low | medium | high)  -- AI-predicted
├── lat, lng (decimal)
├── address (text)             -- Geocoded
├── status (enum: new | verified | in_progress | resolved)
├── priority_score (decimal)   -- 0–100, computed
├── confirmations (int, default 0)
├── rejections (int, default 0)
├── created_at, updated_at
├── resolved_at (timestamptz, nullable)
└── location_sensitivity (decimal)  -- 0–1, for priority

verifications
├── id (uuid, PK)
├── issue_id (uuid, FK → issues)
├── user_id (uuid, FK → profiles)
├── vote (enum: confirm | reject)
├── created_at
└── UNIQUE(issue_id, user_id)  -- One vote per user per issue

resolution_logs (optional, for audit)
├── id (uuid, PK)
├── issue_id (uuid, FK)
├── actor_id (uuid, FK → profiles)
├── from_status, to_status
├── created_at
└── notes (text)
```

### Enums (PostgreSQL)

```sql
CREATE TYPE issue_type_enum AS ENUM ('pothole', 'garbage', 'streetlight', 'water_leak', 'other');
CREATE TYPE severity_enum AS ENUM ('low', 'medium', 'high');
CREATE TYPE issue_status_enum AS ENUM ('new', 'verified', 'in_progress', 'resolved');
CREATE TYPE vote_enum AS ENUM ('confirm', 'reject');
CREATE TYPE user_role_enum AS ENUM ('citizen', 'authority', 'volunteer');
```

---

## 4. Priority Scoring Engine

**Formula (rule-based, extensible):**

```
priority_score = 
  w1 * location_sensitivity   (0–1, roads > lanes)
+ w2 * severity_score         (low=0.3, medium=0.6, high=1.0)
+ w3 * time_factor            (older = higher, logarithmic)
+ w4 * verification_bonus     (confirmations - rejections, capped)
+ w5 * status_boost           (verified > new)

Weights (tunable): w1=0.2, w2=0.3, w3=0.2, w4=0.2, w5=0.1
Normalize to 0–100.
```

**Location sensitivity** (simplified for MVP):
- Use road type from OSM/Mapbox if available, else default 0.5
- Or: proximity to schools/hospitals (future)

---

## 5. AI / Intelligence Layer

### Image Classification (Mock First)
- **Mock**: Return random from `{pothole, garbage, streetlight, water_leak}` + severity
- **Real options**: Google Cloud Vision, TensorFlow.js + MobileNet, Hugging Face

### Text NLP (Mock First)
- **Mock**: Keyword match (e.g., "pothole" → pothole)
- **Real**: Hugging Face transformers, OpenAI API

### Verification Threshold
- **Verified** when `confirmations >= 3` AND `confirmations > rejections`

---

## 6. API Design (Next.js API Routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/issues` | GET | List issues (filters: bounds, status, type) |
| `/api/issues` | POST | Create issue (image upload → Storage, then insert) |
| `/api/issues/[id]` | GET | Single issue |
| `/api/issues/[id]` | PATCH | Update status (authority/volunteer) |
| `/api/verify` | POST | Add confirmation/rejection |
| `/api/ai/classify` | POST | Classify image + optionally text |
| `/api/dashboard/stats` | GET | Aggregates (resolved count, avg time, heatmap data) |

---

## 7. Frontend Structure

```
/app
  /page.tsx              → Landing + Map (default)
  /report/page.tsx       → Report issue flow
  /dashboard/page.tsx    → Authority/volunteer dashboard
  /issue/[id]/page.tsx   → Issue detail + verify
  /api/...               → API routes
/components
  /map/IssueMap.tsx      → Mapbox map + pins
  /report/ReportForm.tsx → Upload, describe, submit
  /dashboard/StatsCards.tsx
  /dashboard/IssueList.tsx
  /ui/...                → Reusable UI
/lib
  /supabase.ts
  /ai.ts                 → AI service interface
  /priority.ts           → Scoring logic
```

---

## 8. Key Flows

### Report Flow
1. User selects image → upload to Supabase Storage
2. Call `/api/ai/classify` with image URL
3. Get GPS (browser geolocation or manual)
4. POST `/api/issues` with all data
5. Redirect to map or issue detail

### Verification Flow
1. User views issue on map or detail page
2. Clicks 👍 or 👎 → POST `/api/verify`
3. If threshold met, issue status → `verified`
4. Recalculate priority_score (cron or on-demand)

### Authority Flow
1. Dashboard shows issues sorted by priority_score DESC
2. Mark "In Progress" or "Resolved"
3. Resolved: set resolved_at, status=resolved

---

## 9. Security & RLS (Supabase)

- **profiles**: Users can read all, update own
- **issues**: Public read; insert if authenticated
- **verifications**: Insert if authenticated; one per user per issue
- **PATCH issues**: Only if role = authority | volunteer

---

## 10. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
# Optional for real AI:
GOOGLE_VISION_API_KEY=
OPENAI_API_KEY=
```

---

## Questions for You (Before Implementation)

1. **Supabase vs Firebase**  
   I recommend Supabase for relational queries and SQL aggregations. Are you okay with Supabase, or do you strongly prefer Firebase?

2. **Mapbox**  
   Mapbox has a free tier. Do you already have a Mapbox token, or should we add a fallback (e.g., Leaflet + OpenStreetMap) for demo without keys?

3. **AI for demo**  
   Start with a **mock** AI (random/fixed outputs) so the flow works end-to-end without API keys. Should we also wire a real option (e.g., Google Vision) behind a feature flag?

4. **Auth**  
   Anonymous reporting vs. require sign-up for MVP? I suggest: **optional auth** – allow report without login (store session/anonymous ID), but require auth for verification and dashboard.

5. **Verification threshold**  
   Use `N = 3` confirmations to mark as "Verified". Good for demo, or prefer 2/5?

Once you confirm these, I'll proceed to scaffold the project and implement step-by-step.
