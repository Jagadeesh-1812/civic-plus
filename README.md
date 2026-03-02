# CivicPulse

**"Your neighborhood's heartbeat"**

A civic-tech web app that lets citizens report hyperlocal issues (potholes, garbage, broken streetlights, water leaks), uses AI + community verification to prioritize them, and provides full transparency for resolution.

---

## Problem

Local civic issues fall into a visibility gap: citizens don't know where to report, authorities don't know what's urgent, and issues get ignored. CivicPulse bridges this with:

- **AI-powered categorization** – Auto-detect issue type and severity from photos
- **Community verification** – Crowdsourced confirmations boost trust
- **Priority scoring** – Issues ranked by urgency for authorities
- **Transparency dashboard** – Public tracking of resolution metrics

---

## Architecture

```
Frontend (Next.js + Tailwind)
    ↕
API Routes (/api/issues, /api/verify, /api/ai, /api/dashboard)
    ↕
Supabase (PostgreSQL + Auth + Storage)  OR  In-memory mock (no config)
```

- **Map**: Mapbox GL JS (optional – works without token in fallback mode)
- **AI**: Mock classifier by default; swap in Google Vision / TF.js for production

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full details.

---

## Quick Start

### 1. Install & run (demo mode – no config)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs with in-memory mock data. No Supabase or Mapbox needed.

### 2. Add Mapbox (optional)

1. Get a token at [mapbox.com](https://mapbox.com)
2. Create `.env.local`:

```
NEXT_PUBLIC_MAPBOX_TOKEN=your-token
```

### 3. Add Supabase (full persistence)

1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema: copy `supabase/migrations/001_initial_schema.sql` into the SQL Editor and run it
3. Add to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Demo Flow

1. **Report** – Go to "Report Issue", upload a photo, add optional description
2. **AI tags** – Issue type and severity are auto-detected (mock AI)
3. **Map** – Issue appears on the live map
4. **Verify** – Open an issue and click 👍 or 👎 to confirm/reject
5. **Priority** – Issues with more confirmations get higher priority
6. **Dashboard** – Authorities mark issues "In Progress" or "Resolved"
7. **Metrics** – Dashboard shows resolution stats and transparency data

---

## Key Features

| Feature | Description |
|--------|-------------|
| Issue reporting | Image upload, AI categorization, GPS location |
| Smart map | Color-coded pins by type, severity, status |
| Verification | Community confirm/reject; 3+ confirms → "Verified" |
| Priority engine | Score from location, severity, time, verifications |
| Dashboard | Stats, issue list by priority, status updates |

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL) or in-memory mock
- **Maps**: Mapbox GL JS
- **AI**: Mock service (extensible to Vision API, TF.js)

---

## Project Structure

```
app/
  page.tsx           # Home – map view
  report/page.tsx    # Report flow
  issue/[id]/        # Issue detail + verify
  dashboard/         # Transparency dashboard
  api/               # API routes
components/
  map/IssueMap.tsx
  report/ReportForm.tsx
  ui/Nav.tsx
lib/
  supabase.ts
  ai.ts
  priority.ts
  mock-store.ts
  types.ts
supabase/migrations/
  001_initial_schema.sql
```

---

## License

MIT
