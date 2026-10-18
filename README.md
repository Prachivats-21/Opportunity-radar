# Opportunity Radar

Personalized discovery for student opportunities: hackathons, internships, competitions, fellowships, and student programs.

## What this version does

- Responsive React web interface with a radar-inspired visual identity.
- Browse, search, and filter a small curated set of sourced opportunity records.
- Enter a student profile and receive ranked matches with readable reasons and eligibility states.
- Submit a new opportunity description and source URL for structured extraction using Gemma through a configurable local Ollama endpoint; custom listings and saved items persist in the browser.
- Validate structured model output with Pydantic and keep deterministic eligibility rules in Python.
- Preserve source links and mark unknown or unverified fields instead of inventing them.

## Data sources and automated imports

The curated JSON file remains the seed set, not a comprehensive live feed. The backend now includes a provider adapter layer in `backend/app/sources.py`. Imported records are stored separately at `backend/data/imported_opportunities.json` (ignored by Git), merged into `GET /api/opportunities`, and deduplicated against curated listings. Source attribution and original application URLs are preserved.

### Implemented adapter types

- **The Muse API** — requires `THE_MUSE_API_KEY`; returns relevant student/early-career listings from the configured number of API pages.
- **Adzuna API** — requires `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`. Configure the country/query and confirm the provider actually supports that market for your account. Follow Adzuna's attribution and usage terms.
- **Greenhouse public job boards** — configure comma-separated `GREENHOUSE_BOARD_TOKENS` for specific company boards whose published listings you are authorized to ingest. This is not a global jobs search API.
- **Lever public postings** — configure comma-separated `LEVER_SITE_NAMES` for specific company boards. This is not a global jobs search API.
- **RSS/Atom feeds** — configure comma-separated publisher-provided or otherwise authorized feed URLs in `OPPORTUNITY_RADAR_RSS_FEEDS`.

The adapters only import records whose title/content clearly suggests an opportunity type. They do not guess dates or eligibility. Imported records start as `needs_recheck` and carry a note directing users to verify the original source. If a provider fails, the last successful cache for that provider is retained.

### API endpoints

- `GET /api/sources` returns provider readiness, configuration status, cached record counts, and last-sync time. It never returns API keys.
- `POST /api/sources/sync` synchronizes configured adapters. For local development, this endpoint is allowed only from loopback when no sync token is set. For a remote deployment, set `OPPORTUNITY_RADAR_SYNC_TOKEN` in the backend environment and send it in the `X-Source-Sync-Token` header.
- `GET /api/opportunities` returns curated records plus previously imported records. When enabled and adapters are configured, it schedules a background sync at most once per configured interval.

Example local sync:

```bash
curl -X POST http://127.0.0.1:8000/api/sources/sync \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Copy `backend/.env.example` into a local environment file (do not commit secrets) and fill in keys/board names only after obtaining provider access. For remote deployments, place secrets in the host's environment/secret manager, never in frontend variables.

### Sources awaiting approved access

Unstop, Devfolio, Hack2Skill, Internshala, Major League Hacking, Devpost, Opportunity Desk and India's National Scholarship Portal are exposed in the source registry as pending partner/feed or government-data access. They are not falsely represented as live connectors. The Unstop integration needs a confirmed authorized catalogue/feed contract; MLH's documented API is not a universal event directory; and Devpost's terms prohibit automated scraping/crawling. Do not enable unofficial endpoints or scrape restricted sources.

Source/API references: [The Muse API](https://www.themuse.com/developers/api/v2), [Adzuna API](https://developer.adzuna.com/overview), [Greenhouse Job Board API](https://developers.greenhouse.io/job-board.html), [Lever Postings API](https://github.com/lever/postings-api), [Devpost Terms](https://info.devpost.com/legal/terms-of-service), [Unstop partner programme](https://unstop.com/our-partners/become-a-partner/amp).

This integration framework does not mean those providers have been activated yet: live imports start only after credentials, allowed board/feed identifiers, or partner approval are configured. Re-check source pages before applying because dates and eligibility can change.

## Stack

- Frontend: React + TypeScript + Vite + CSS
- Backend: Python + FastAPI + Pydantic
- Local AI: Ollama + Gemma (`gemma3:1b` suggested as a small starting point; model availability and performance vary by machine)
- Tests: pytest
- Data: JSON seed file for MVP; no database or authentication in this version

## Run locally

### 1. Start Ollama and pull Gemma

Install Ollama from https://ollama.com/download, then:

```bash
ollama pull gemma3:1b
ollama run gemma3:1b
```

Exit the model session with `Ctrl+D`. Ollama must be running while using AI extraction/matching. The app still provides deterministic matching if Ollama is unavailable.

### 2. Start the backend

In a terminal, from the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API health check: http://127.0.0.1:8000/health
API docs: http://127.0.0.1:8000/docs

### 3. Start the frontend

Open a second terminal at the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually http://localhost:5173.

## AI behavior and limitations

- Gemma is used to extract structured fields from opportunity text and to generate a semantic match explanation.
- Python rules, not the model, decide hard conflicts such as an expired deadline or a clearly incompatible academic year.
- If eligibility or deadline information is missing, the result remains unknown rather than being guessed.
- The local Ollama configuration sends inference requests to the Ollama service on the configured machine. Do not expose the Ollama port publicly. Custom listings are stored in browser local storage in this MVP; they are not shared across devices.
- This local setup is not automatically a public multi-user AI service. A hosted deployment needs a hosted model endpoint or a securely managed model runtime. Never put API keys in frontend code.
- The seed dataset is manually curated and not guaranteed to be complete or current. Source links are the authority.

## Deploying

The React frontend can be deployed as a static site on Render. The FastAPI backend can be deployed as a Render web service. For public AI inference, configure a server-side Gemma-compatible provider or a securely hosted Ollama service using environment variables. Do not point a public server at `localhost` on your laptop; that address refers to the server itself, not your Mac. Keep a non-AI matching fallback if inference is temporarily unavailable.

Suggested Render build commands:

Frontend:
- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`

Backend:
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Set `VITE_API_URL` to the public backend URL at frontend build time. Set `OLLAMA_BASE_URL` and `OLLAMA_MODEL` only where an Ollama service is actually reachable.

## Tests

```bash
cd backend
pytest -q
```

## License

MIT. See `LICENSE`.
