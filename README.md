# Opportunity Radar

Personalized discovery for student opportunities: hackathons, internships, competitions, fellowships, and student programs.

## What this version does

- Responsive React web interface with a radar-inspired visual identity.
- Browse, search, and filter a small curated set of sourced opportunity records.
- Enter a student profile and receive ranked matches with readable reasons and eligibility states.
- Submit a new opportunity description and source URL for structured extraction using Gemma through a configurable local Ollama endpoint; custom listings and saved items persist in the browser.
- Validate structured model output with Pydantic and keep deterministic eligibility rules in Python.
- Preserve source links and mark unknown or unverified fields instead of inventing them.

## Important data note

The included records are a tiny seed dataset, not a comprehensive live feed. Each record has a source URL and verification timestamp. The app does not claim to scrape or sync Unstop, LinkedIn, or other platforms. Re-check source pages before applying because dates and eligibility can change.

## Stack

- Frontend: React + TypeScript + Vite + CSS
- Backend: Python + FastAPI + Pydantic
- Local AI: Ollama + Gemma (\`gemma3:1b\` suggested as a small starting point; model availability and performance vary by machine)
- Tests: pytest
- Data: JSON seed file and imported-source cache; no database or authentication in this MVP

## Run locally

### 1. Configure provider access (optional)

Copy the example config and fill only provider credentials you have actually obtained:

\`\`\`bash
cd backend
cp .env.example .env
\`\`\`

\`.env\` is ignored by Git. Never commit secrets or put them in frontend \`VITE_*\` variables.

Available settings:

- \`THEMUSE_API_KEY\`: API key obtained through The Muse developer process.
- \`ADZUNA_APP_ID\` and \`ADZUNA_APP_KEY\`: Adzuna credentials. Verify coverage, display attribution and licence before use.
- \`GREENHOUSE_BOARD_TOKENS\`: comma-separated tokens for specific Greenhouse employer boards.
- \`LEVER_SITES\`: comma-separated identifiers for specific Lever employer sites.
- \`SOURCE_SYNC_TOKEN\`: required to authorize manual source-sync requests. Generate a secret with:

\`\`\`bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
\`\`\`

The Muse and Adzuna connectors remain inactive until credentials are supplied. Greenhouse and Lever only query the employer boards you configure; neither is a global job index.

### 2. Start Ollama and pull Gemma (optional, for AI features)

Install Ollama from https://ollama.com/download, then:

\`\`\`bash
ollama pull gemma3:1b
ollama run gemma3:1b
\`\`\`

Exit the model session with \`Ctrl+D\`. Ollama must be running while using AI extraction/matching. The app still provides deterministic matching if Ollama is unavailable.

### 3. Start the backend

In a terminal, from the repository root:

\`\`\`bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
\`\`\`

API health check: http://127.0.0.1:8000/health  
API docs: http://127.0.0.1:8000/docs

### 4. Start the frontend

Open a second terminal at the repository root:

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

Open the local URL printed by Vite, usually http://localhost:5173.

## Source integrations

The backend exposes:

- \`GET /api/sources\`: provider availability, configuration state, and last-sync summary. It never returns secrets.
- \`POST /api/sources/sync\`: fetch configured providers and persist imported records to \`backend/data/imported_opportunities.json\`. Requires the \`X-Sync-Token\` header matching server-side \`SOURCE_SYNC_TOKEN\`.
- \`GET /api/opportunities\`: returns the seed records plus cached source imports.

For local development, sync using the secret from \`backend/.env\`:

\`\`\`bash
curl -X POST http://127.0.0.1:8000/api/sources/sync \\
  -H "X-Sync-Token: YOUR_SOURCE_SYNC_TOKEN"
\`\`\`

Configured provider adapters:

| Provider | Data access | Notes |
| --- | --- | --- |
| The Muse | Documented jobs API | Requires developer API key; request Internship-level results. |
| Adzuna | Documented jobs API | Requires app ID/key; check country coverage, attribution and terms. |
| Greenhouse | Public company job-board endpoints | Must configure specific employer board tokens; filters likely student roles. |
| Lever | Public company postings endpoints | Must configure specific employer site identifiers; filters likely student roles. |

The provider registry also tracks sources that are important but not currently connected: Unstop, Devfolio, Hack2Skill, MLH, Devpost, Internshala, Opportunity Desk and Buddy4Study. For these, the next step is to obtain a supported feed, API access or explicit permission. A platform appearing in \`GET /api/sources\` means it is tracked in the integration registry, **not** that its listings are being imported. No scraping or private undocumented endpoints are used by these adapters.

The source-sync endpoint is protected because it triggers outbound requests and could otherwise be abused on a public deployment. Use HTTPS and a strong secret in production, and add admin authentication/rate limiting before exposing source management more broadly.

Imported records preserve the provider name and original application URL. Details such as eligibility and deadline are not guessed; imported records are marked \`needs_recheck\` for confirmation. This first version caches imports in a local JSON file and merges by stable record ID. It is not yet a multi-instance, database-backed scheduled ingestion service.

## AI behavior and limitations

- Gemma is used to extract structured fields from opportunity text and to generate a semantic match explanation.
- Python rules, not the model, decide hard conflicts such as an expired deadline or a clearly incompatible academic year.
- If eligibility or deadline information is missing, the result remains unknown rather than being guessed.
- The local Ollama configuration sends inference requests to the Ollama service on the configured machine. Do not expose the Ollama port publicly. Custom listings are stored in browser local storage in this MVP; they are not shared across devices.
- This local setup is not automatically a public multi-user AI service. A hosted deployment needs a hosted model endpoint or a securely managed model runtime. Never put API keys in frontend code.
- The seed dataset is manually curated and not guaranteed to be complete or current. Source links are the authority.

## Deploying

The React frontend can be deployed as a static site on Render. The FastAPI backend can be deployed as a Render web service. For public AI inference, configure a hosted model endpoint or a securely hosted Ollama service using environment variables. Do not point a public server at \`localhost\` on your laptop; that address refers to the server itself, not your Mac. Keep a non-AI matching fallback if inference is temporarily unavailable.

Suggested Render build commands:

Frontend:
- Root directory: \`frontend\`
- Build command: \`npm install && npm run build\`
- Publish directory: \`dist\`

Backend:
- Root directory: \`backend\`
- Build command: \`pip install -r requirements.txt\`
- Start command: \`uvicorn app.main:app --host 0.0.0.0 --port $PORT\`

Set \`VITE_API_URL\` to the public backend URL at frontend build time. Set \`OLLAMA_BASE_URL\` and \`OLLAMA_MODEL\` only where an Ollama service is actually reachable. Set provider keys and \`SOURCE_SYNC_TOKEN\` only as backend environment variables on the hosting platform.

## Tests

\`\`\`bash
cd backend
pytest -q
\`\`\`

## License

MIT. See \`LICENSE\`.
