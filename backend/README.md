# Personal portfolio backend

This is a small FastAPI service for the island portfolio. It provides the guide
chat endpoint, persistent bug-hunt scores, and health checks. Notebook content is
bundled into the frontend; conversation history remains in the browser.

## Run locally

From the repository root, `make run` starts both the Vite frontend and this
FastAPI service through Nx. To run only the backend directly:

```sh
cd backend
uv sync
cp .env.example .env
uv run uvicorn app.main:app --reload --port 58000
```

The equivalent Nx target is `pnpm exec nx run backend:serve`.

Configure Ollama Cloud in `backend/.env` using the included example:

```dotenv
OLLAMA_BASE_URL=https://ollama.com
OLLAMA_MODEL=gpt-oss:120b
OLLAMA_API_KEY=your_ollama_cloud_api_key
```

The API key is used only by the backend and is sent as a bearer token to
Ollama Cloud. The frontend never receives it.

The API is available at `http://127.0.0.1:58000`. The frontend uses
`VITE_API_BASE_URL` when provided and otherwise defaults to
`http://127.0.0.1:58000/api`.

## Routes

- `GET /health` and `GET /healthz`
- `POST /api/chat`

The chat response is validated as:

```json
{
  "message": "Let's look at the projects.",
  "destination_object_id": "starship"
}
```

Chat requests contain at most 300 characters per message and at most 10
user-authored messages. The browser keeps only its latest 10 conversation
messages before making a request.

The provider boundary is `app.providers.base.LLMProvider`. Ollama is accessed
through LangChain's `ChatOllama` integration; a different provider can
implement the same `complete` method and be supplied to `create_app`.

## Verify

```sh
uv run pytest
```

## Deploy to Cloud Run

The [`deploy.yml`](../.github/workflows/deploy.yml) workflow is the repository's
single deployment workflow. It uses the `dorny/paths-filter` action to identify
applications, then runs backend tests and deploys the `backend/` source
directly to Cloud Run only when backend files changed. The `Procfile` supplies
the FastAPI/Uvicorn
entrypoint. The workflow can also be started manually. The `backend` GitHub
environment must provide:

- Actions secrets: `GCP_WORKLOAD_IDENTITY_PROVIDER`, `OLLAMA_API_KEY`, and
  `ALLOWED_CORS_ORIGIN`.
- Actions variables: `GCP_PROJECT_ID`, `GCP_REGION`,
  `CLOUD_RUN_SERVICE`, `GCP_SERVICE_ACCOUNT`, `OLLAMA_BASE_URL`,
  `OLLAMA_MODEL`, and `OLLAMA_TIMEOUT_SECONDS`.

Set `ALLOWED_CORS_ORIGIN` to the exact deployed Pages origin, without a path
or trailing slash, for example `https://laughcheeta1.github.io`. The workflow
translates that secret into the backend's `CORS_ORIGINS` setting. FastAPI then
rejects browser preflight requests from other origins. CORS controls browser
cross-origin access; it is not API authentication. The Cloud Run service must
be publicly invokable because the browser calls it from GitHub Pages.

Source deployment requires Cloud Run Source Developer, Service Usage Consumer,
and Service Account User permissions for the deployer, plus the Cloud Run
Builder permission for the Cloud Build service account. Because the workflow
uses `--allow-unauthenticated`, the deployer also needs permission to set the
service IAM policy, typically through Cloud Run Admin. Enable the Cloud Run
and Cloud Build APIs in the Google Cloud project.

## Bug hunt scores

Set `DATABASE_URL` in `backend/.env` to the configured SQLAlchemy PostgreSQL URL
(`postgresql+psycopg://...`). On first use, the game creates `users`,
`bug_hunt_players`, `bug_hunt_sessions`, and `bug_hunt_scores`. Existing game
profiles are upgraded with a `user_id` foreign key and their known name is
backfilled into `users.usernames`. The database role needs CREATE and ALTER
privileges on these tables. The migration is repeatable and preserves scores. The deployed backend also needs `DATABASE_URL` in its environment.

- `POST /api/bug-hunt/sessions`: `{player_id: UUID, display_name: string}` starts
  a 45-second server-timed round and returns its ID, secret token, and timestamps.
- `POST /api/bug-hunt/sessions/{id}/score`: `{session_token: string, score: integer}`
  saves one score of 0–100 after the timer and within five minutes. Identical
  retries are idempotent; conflicting retries and concurrent rounds are rejected.
- `GET /api/bug-hunt/leaderboard`: returns up to ten players ranked by their
  highest saved score. Unfinished rounds never appear.

Players are anonymous browser identities, not authenticated accounts. Clearing
browser storage creates a new identity. Timing, single submission, and a physical
score ceiling are checked on the server; individual hits run in the browser and
are not server-authoritative anti-cheat. Database failures return 503 and never
produce a fabricated leaderboard or a falsely saved score.

### User IDs and name history

`users.id` is the same UUID already stored by the browser as `player_id`.
`bug_hunt_players.user_id` references it; scores still link through their existing
sessions. Changing a name never changes the UUID or resets a personal best.

`users.usernames` is an ordered JSON array (JSONB on PostgreSQL). Each accepted
round appends its normalized name if it differs from the last entry. For example,
Ada → Grace → Grace → Ada becomes `["Ada", "Grace", "Ada"]`. Rejected requests
never append names. Name changes are transactional and locked per user, and
`remember_username` can be reused by other games using the same visitor UUID.

The leaderboard reads the final name in this array and ranks each user's best
score. Bug-hunt rounds still update the legacy `bug_hunt_players.display_name` for
compatibility, but it is not the leaderboard's name source. History stays in the
database rather than being exposed by the public leaderboard API.

Existing saved names initialize the list; names overwritten before this upgrade
cannot be recovered. The older `visits.user` and `agent_queries.user` UUID fields
have no current application identity wiring, so the migration does not guess
connections to those records. Browser storage remains the identity source; this
is not sign-in or cross-device identity.
