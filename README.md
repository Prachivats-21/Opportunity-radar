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

<!-- AUTO-README-AGENT:START -->
### 🤖 Autonomous Agent Telemetry & Activity Log
*Auto-updated after commands and executions via OpenCode Agent integration.*

- **Last Command**: `Added student login entrance animations & Lumora self-contai` (✅ Success)
- **Last Sync**: `2026-10-19 13:53:05 UTC`
- **Active Branch**: `master` (`e2c50ba`)

| Timestamp (UTC) | Command | Status | Commit |
|:---|:---|:---:|:---:|
| 2026-10-19 13:53:05 | `Added student login entrance animations & Lumora s` | ✅ | `e2c50ba` |
| 2026-10-19 11:14:29 | `npm run build` | ✅ | `440f584` |
| 2026-10-19 10:27:04 | `npm test` | ✅ | `bfd0d04` |
<!-- AUTO-README-AGENT:END -->
