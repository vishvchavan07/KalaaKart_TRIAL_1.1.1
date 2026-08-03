# KalaaKart — Smart Rental Recommendations (Phase 2, AI Layer I — Full-Stack MVP)

A runnable, demoable MVP that wraps the existing **rule-based rental recommendation engine** in an Express REST API and a clean dark-mode single-page UI.

> **Scope**: strictly the rental-recommendation feature — no auth, no database, no marketplace, no LLM calls.

---

## Project structure

```
TRAIL CODE/
├── engine.js           ← original rule engine (untouched)
├── rules-data.json     ← original rules data (untouched)
├── example.js          ← original CLI demo (untouched)
│
├── backend/
│   ├── engine.js       ← copy of the engine (imported by server.js)
│   ├── rules-data.json ← copy of the rules data
│   ├── server.js       ← Express API (port 3001)
│   ├── package.json
│   └── tests/
│       └── recommendations.test.js
│
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

---

## Quick start (two terminals)

### Terminal 1 — Backend

```bash
cd "TRAIL CODE/backend"
npm install
npm start
# → http://localhost:3001
```

### Terminal 2 — Frontend

Open `frontend/index.html` directly in your browser — it's static, no build step needed:

```bash
open "TRAIL CODE/frontend/index.html"
# or on Windows:  start TRAIL CODE/frontend/index.html
```

The frontend calls `http://localhost:3001` — make sure the backend is running first.

---

## API reference

### `GET /api/health`

Returns `200 { status: "ok", timestamp: "..." }`. Use this to verify the server is up.

```bash
curl http://localhost:3001/api/health
```

### `GET /api/recommendations`

| Query param        | Type    | Required | Description                         |
|--------------------|---------|----------|-------------------------------------|
| `branch`           | string  | ✅        | Branch name (see list below)        |
| `semester`         | integer | ✅        | 1 – 8                               |
| `semesterStartDate`| string  | ✅        | ISO date, e.g. `2026-08-10`         |

**Valid branch values** (exactly as they appear in `rules-data.json`):
- `Computer Engineering`
- `Electronics Engineering`
- `Electrical Engineering`
- `IT`
- `Mechanical Engineering`
- `Civil Engineering`

**Success response** `200`:
```json
{
  "recommendations": [
    {
      "type": "lab",
      "title": "Electronics Lab",
      "items": ["Breadboard", "Arduino Uno", ...],
      "message": "Heading into Electronics Lab this semester..."
    }
  ],
  "text": "Rental recommendations for Computer Engineering, Semester 3:\n\n1. [LAB] ..."
}
```

**Error response** `400`:
```json
{ "error": "Missing required query param: branch (non-empty string)." }
```

---

## curl examples (for quick manual testing)

```bash
# ✅ Computer Engineering, Sem 3, started Aug 10 2026
curl "http://localhost:3001/api/recommendations?branch=Computer+Engineering&semester=3&semesterStartDate=2026-08-10"

# ✅ Mechanical Engineering, Sem 6, started Jul 20 2026
curl "http://localhost:3001/api/recommendations?branch=Mechanical+Engineering&semester=6&semesterStartDate=2026-07-20"

# ❌ 400 — missing branch
curl "http://localhost:3001/api/recommendations?semester=3&semesterStartDate=2026-08-10"

# ❌ 400 — semester out of range
curl "http://localhost:3001/api/recommendations?branch=IT&semester=9&semesterStartDate=2026-08-10"

# ❌ 400 — invalid date
curl "http://localhost:3001/api/recommendations?branch=IT&semester=5&semesterStartDate=not-a-date"
```

---

## Running the automated tests

```bash
cd "TRAIL CODE/backend"
npm test
```

Jest + supertest. Four test suites:
- `/api/health` → status ok
- `400` when branch is missing
- `400` when semester is out of range
- `400` when semesterStartDate is invalid
- `200` happy path (Computer Engineering, Sem 3)
- `200` empty-state (no active windows)

---

## Sanity check — original engine still works standalone

```bash
cd "TRAIL CODE"
node example.js
```

This runs the original unmodified engine. Output should show three student profiles with their recommendations.

---

## Design decisions & assumptions

| Decision | Rationale |
|---|---|
| Backend on port `3001` | Avoids conflict with common dev tools on 3000. Set `PORT` env var to override. |
| `engine.js` copied into `/backend` | Keeps the backend self-contained with its own `__dirname` path resolution for `rules-data.json`. No symlinks required. |
| Frontend is static HTML | No framework needed for a one-form MVP; opens with `open index.html`. |
| Branch list hardcoded in `app.js` | Extracted directly from `rules-data.json` — update both if new branches are added. |
| Jest + supertest for tests | Lightest test stack that can exercise real HTTP semantics without spawning a live port. |

---

## Extending

- **New branch or lab**: edit `rules-data.json` (both root and `/backend` copies), add the branch string to `BRANCHES` in `frontend/app.js`.
- **New exam/hackathon season**: edit `rules-data.json` only — no code changes.
- **Plugging into the real KalaaKart backend**: replace the static query params with `req.user`-derived profile data; the engine's signature stays the same.
