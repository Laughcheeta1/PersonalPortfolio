# Personal portfolio backend

This is a small FastAPI service for the island portfolio. It serves the HTML
shown in the existing 3D notebook panels and provides the guide chat endpoint.
The backend is stateless; conversation history remains in the browser.

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

Install and start Ollama separately, then pull the configured model:

```sh
ollama serve
ollama pull llama3.2
```

The API is available at `http://127.0.0.1:8000`. The frontend uses
`VITE_API_BASE_URL` when provided and otherwise defaults to
`http://127.0.0.1:8000/api`.

## Routes

- `GET /health` and `GET /healthz`
- `GET /api/panels/{landmark-id}:{front|back}`
- `POST /api/chat`

The chat response is validated as:

```json
{
  "message": "Let's look at the projects.",
  "destination_object_id": "starship"
}
```

The provider boundary is `app.providers.base.LLMProvider`. Ollama is the
default HTTP adapter; a different provider can implement the same `complete`
method and be supplied to `create_app`.

## Verify

```sh
uv run pytest
```
