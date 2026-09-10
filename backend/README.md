# Personal portfolio backend

This is a small FastAPI service for the island portfolio. It serves the
standalone HTML documents shown in the 3D notebook panels and provides the
guide chat endpoint. The backend is stateless; conversation history remains in
the browser.

## Run locally

From the repository root, `make run` starts both the Vite frontend and this
FastAPI service through Nx. To run only the backend directly:

```sh
cd backend
uv sync
cp .env.example .env
uv run uvicorn app.main:app --reload --port 8000
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

The API is available at `http://127.0.0.1:8000`. The frontend uses
`VITE_API_BASE_URL` when provided and otherwise defaults to
`http://127.0.0.1:8000/api`.

## Routes

- `GET /health` and `GET /healthz`
- `GET /api/panels/{landmark-id}:{front|back}` (returns a complete HTML document)
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

The [`deploy-backend.yml`](../.github/workflows/deploy-backend.yml) workflow
runs backend tests and deploys the `backend/` source directly to Cloud Run
using Google's Python buildpacks and Cloud Build when `master` receives
backend changes. The `Procfile` supplies the FastAPI/Uvicorn entrypoint. The
workflow can also be started manually. The `backend` GitHub environment must
provide:

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
