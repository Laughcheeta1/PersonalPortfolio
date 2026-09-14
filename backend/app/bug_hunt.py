"""Persistent, server-timed rounds for the island's anonymous bug hunt."""
from __future__ import annotations

import hashlib
import secrets
import threading
import time
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import Column, Float, ForeignKey, Integer, String, Table, Uuid, func, insert, inspect, select, text, update
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError

from .users import ensure_user, metadata, remember_username, users

DURATION_SECONDS = 45
MAX_SCORE = 100  # One hit per 450 ms, matching the client's cane cooldown.
SUBMISSION_GRACE_SECONDS = 300
players = Table(
    "bug_hunt_players", metadata,
    Column("id", String(36), primary_key=True),
    Column("display_name", String(24), nullable=False),
    Column("user_id", Uuid(as_uuid=False), ForeignKey("users.id"), nullable=False),
)
sessions = Table(
    "bug_hunt_sessions", metadata,
    Column("id", String(36), primary_key=True),
    Column("player_id", String(36), ForeignKey("bug_hunt_players.id"), nullable=False, index=True),
    Column("token_hash", String(64), nullable=False),
    Column("started_at", Float, nullable=False),
)
scores = Table(
    "bug_hunt_scores", metadata,
    Column("session_id", String(36), ForeignKey("bug_hunt_sessions.id"), primary_key=True),
    Column("score", Integer, nullable=False),
    Column("submitted_at", Float, nullable=False),
)


class StrictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")


class StartRound(StrictRequest):
    player_id: UUID
    display_name: str = Field(min_length=1, max_length=24)

    @field_validator("display_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = " ".join(value.split())
        if not value or not all(character.isprintable() for character in value):
            raise ValueError("Use a printable player name")
        return value


class SubmitScore(StrictRequest):
    session_token: str = Field(min_length=32, max_length=128)
    score: int = Field(strict=True, ge=0, le=MAX_SCORE)


class BugHuntStore:
    def __init__(self, engine: Engine | None) -> None:
        self.engine = engine
        self._ready = False
        self._schema_lock = threading.Lock()

    def initialize(self) -> Engine:
        if self.engine is None:
            raise HTTPException(503, "The score database is not configured.")
        with self._schema_lock:
            if not self._ready:
                with self.engine.begin() as connection:
                    # Serialize additive schema upgrades across backend processes.
                    if connection.dialect.name == "postgresql":
                        connection.execute(text("SELECT pg_advisory_xact_lock(192837465)"))
                    metadata.create_all(connection)
                    columns = {column["name"] for column in inspect(connection).get_columns(players.name)}
                    if "user_id" not in columns:
                        user_type = "UUID" if connection.dialect.name == "postgresql" else "CHAR(32)"
                        connection.execute(text(f"ALTER TABLE bug_hunt_players ADD COLUMN user_id {user_type} REFERENCES users(id)"))
                    # Existing profiles seed their known name once; scores keep their IDs.
                    legacy = connection.execute(select(players.c.id, players.c.display_name).where(players.c.user_id.is_(None))).all()
                    for player_id, name in legacy:
                        ensure_user(connection, player_id, [name])
                        connection.execute(update(players).where(players.c.id == player_id).values(user_id=player_id))
                    if connection.dialect.name == "postgresql":
                        connection.execute(text("ALTER TABLE bug_hunt_players ALTER COLUMN user_id SET NOT NULL"))
                self._ready = True
        return self.engine

    def start(self, request: StartRound) -> dict:
        engine = self.initialize()
        now = time.time()
        session_id, token = str(uuid4()), secrets.token_urlsafe(32)
        player_id = str(request.player_id)
        with engine.begin() as connection:
            exists = connection.execute(select(players.c.user_id).where(players.c.id == player_id).with_for_update()).first()
            if exists is None:
                remember_username(connection, player_id, request.display_name)
                connection.execute(insert(players).values(id=player_id, user_id=player_id, display_name=request.display_name))
            else:
                active = connection.execute(select(sessions.c.id).where(
                    sessions.c.player_id == player_id,
                    sessions.c.started_at > now - DURATION_SECONDS,
                ).limit(1)).first()
                if active is not None:
                    raise HTTPException(409, "Your previous round is still running. Try again shortly.")
                remember_username(connection, exists.user_id, request.display_name)
                connection.execute(update(players).where(players.c.id == player_id).values(display_name=request.display_name))
            connection.execute(insert(sessions).values(
                id=session_id, player_id=player_id, started_at=now,
                token_hash=hashlib.sha256(token.encode()).hexdigest(),
            ))
        return {
            "session_id": session_id, "session_token": token,
            "duration_seconds": DURATION_SECONDS,
            "started_at": datetime.fromtimestamp(now, timezone.utc).isoformat(),
            "ends_at": datetime.fromtimestamp(now + DURATION_SECONDS, timezone.utc).isoformat(),
        }

    def submit(self, session_id: UUID, request: SubmitScore) -> dict:
        engine = self.initialize()
        with engine.begin() as connection:
            # Row lock serializes simultaneous submissions on PostgreSQL.
            session = connection.execute(select(sessions).where(sessions.c.id == str(session_id)).with_for_update()).mappings().first()
            if session is None or not secrets.compare_digest(
                session["token_hash"], hashlib.sha256(request.session_token.encode()).hexdigest()
            ):
                raise HTTPException(404, "Round not found.")
            existing = connection.execute(select(scores.c.score).where(scores.c.session_id == str(session_id))).scalar_one_or_none()
            if existing is not None and existing != request.score:
                raise HTTPException(409, "This round already has a score.")
            if existing is None:
                elapsed = time.time() - session["started_at"]
                if elapsed < DURATION_SECONDS:
                    raise HTTPException(409, "The round is still running.")
                if elapsed > DURATION_SECONDS + SUBMISSION_GRACE_SECONDS:
                    raise HTTPException(410, "This round has expired.")
                connection.execute(insert(scores).values(session_id=str(session_id), score=request.score, submitted_at=time.time()))
            best = connection.execute(
                select(func.max(scores.c.score)).select_from(scores.join(sessions)).where(sessions.c.player_id == session["player_id"])
            ).scalar_one()
        return {"score": request.score, "personal_best": best}

    def leaderboard(self) -> dict:
        engine = self.initialize()
        # Aggregate by shared user identity before attaching profile history.
        best = (
            select(players.c.user_id, func.max(scores.c.score).label("score"))
            .select_from(players.join(sessions).join(scores))
            .group_by(players.c.user_id).subquery()
        )
        latest_name = func.json_extract(users.c.usernames, "$[#-1]") if engine.dialect.name == "sqlite" else users.c.usernames[-1].as_string()
        with engine.connect() as connection:
            rows = connection.execute(
                select(users.c.usernames, best.c.score)
                .select_from(users.join(best, users.c.id == best.c.user_id))
                .order_by(best.c.score.desc(), latest_name.asc(), users.c.id.asc())
                .limit(10)
            ).mappings().all()
        return {
            "entries": [{"rank": index + 1, "display_name": row["usernames"][-1], "score": row["score"]} for index, row in enumerate(rows)],
            "duration_seconds": DURATION_SECONDS,
        }



def create_bug_hunt_router(engine: Engine | None) -> APIRouter:
    router = APIRouter(prefix="/api/bug-hunt", tags=["bug-hunt"])
    store = BugHuntStore(engine)

    def database_call(operation, *args):
        try:
            return operation(*args)
        except SQLAlchemyError:
            # Do not expose connection strings, SQL parameters, or credentials.
            raise HTTPException(503, "Scores are temporarily unavailable. Please retry.") from None

    @router.post("/sessions", status_code=201)
    def start_round(request: StartRound) -> dict:
        return database_call(store.start, request)

    @router.post("/sessions/{session_id}/score")
    def submit_score(session_id: UUID, request: SubmitScore) -> dict:
        return database_call(store.submit, session_id, request)

    @router.get("/leaderboard")
    def leaderboard() -> dict:
        return database_call(store.leaderboard)

    return router
