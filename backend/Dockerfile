# syntax=docker/dockerfile:1.7

FROM ghcr.io/astral-sh/uv:0.11.29 AS uv
FROM python:3.11-slim-bookworm AS dependencies

WORKDIR /app

COPY --from=uv /uv /uvx /bin/
COPY pyproject.toml uv.lock ./

# Install only the locked runtime dependency set. Application source is copied
# separately so code changes do not invalidate dependency installation.
RUN uv sync --locked --no-dev --no-install-project

FROM python:3.11-slim-bookworm AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

COPY --from=dependencies /app/.venv /app/.venv
COPY app /app/app

# Cloud Run supplies PORT. exec keeps Uvicorn as PID 1 for signal handling.
CMD ["sh", "-c", "exec /app/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port \"${PORT:-8080}\""]
