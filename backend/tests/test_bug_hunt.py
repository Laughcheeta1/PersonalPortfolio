from uuid import uuid4

import httpx
import pytest
from fastapi import FastAPI
from sqlalchemy import create_engine, func, select
from sqlalchemy.pool import StaticPool

from app.bug_hunt import create_bug_hunt_router, scores


@pytest.fixture
def game(monkeypatch):
    now = [1000.0]
    monkeypatch.setattr("app.bug_hunt.time.time", lambda: now[0])
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    app = FastAPI()
    app.include_router(create_bug_hunt_router(engine))
    yield httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test"), now, engine
    engine.dispose()


async def start(client, player_id=None, name="Ada"):
    return await client.post("/api/bug-hunt/sessions", json={"player_id": str(player_id or uuid4()), "display_name": name})


async def submit(client, round, score=12, token=None):
    return await client.post(f"/api/bug-hunt/sessions/{round['session_id']}/score", json={"session_token": token or round["session_token"], "score": score})


@pytest.mark.asyncio
async def test_round_timing_token_validation_and_idempotent_retries(game):
    client, now, engine = game
    async with client:
        response = await start(client)
        assert response.status_code == 201
        round = response.json()
        assert round["duration_seconds"] == 45
        assert (await submit(client, round)).status_code == 409
        now[0] += 45
        assert (await submit(client, round, token="x" * 43)).status_code == 404
        result = await submit(client, round)
        assert result.json() == {"score": 12, "personal_best": 12}
        assert (await submit(client, round)).status_code == 200
        assert (await submit(client, round, score=13)).status_code == 409
    with engine.connect() as connection:
        assert connection.execute(select(func.count()).select_from(scores)).scalar() == 1


@pytest.mark.asyncio
async def test_leaderboard_has_one_best_score_per_player_and_only_completed_rounds(game):
    client, now, _ = game
    player = uuid4()
    async with client:
        assert (await client.get("/api/bug-hunt/leaderboard")).json()["entries"] == []
        first = (await start(client, player)).json()
        now[0] += 45
        await submit(client, first, score=20)
        second = (await start(client, player)).json()
        now[0] += 45
        assert (await submit(client, second, score=2)).json()["personal_best"] == 20
        third = (await start(client, name="Grace")).json()
        now[0] += 45
        await submit(client, third, score=30)
        await start(client, name="Unfinished")
        entries = (await client.get("/api/bug-hunt/leaderboard")).json()["entries"]
        assert entries == [{"rank": 1, "display_name": "Grace", "score": 30}, {"rank": 2, "display_name": "Ada", "score": 20}]


@pytest.mark.asyncio
async def test_expired_rounds_concurrent_rounds_and_impossible_scores(game):
    client, now, _ = game
    player = uuid4()
    async with client:
        round = (await start(client, player)).json()
        assert (await start(client, player)).status_code == 409
        for score in [-1, 101, 1.5, True, "12"]:
            assert (await submit(client, round, score=score)).status_code == 422
        now[0] += 346
        assert (await submit(client, round)).status_code == 410
        assert (await start(client, player)).status_code == 201


@pytest.mark.asyncio
async def test_missing_database_does_not_fabricate_scores():
    app = FastAPI()
    app.include_router(create_bug_hunt_router(None))
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        assert (await client.get("/api/bug-hunt/leaderboard")).status_code == 503
        assert (await start(client)).status_code == 503


@pytest.mark.asyncio
async def test_name_history_stays_with_user_and_leaderboard_uses_latest_name(game):
    from app.users import users
    from app.bug_hunt import players

    client, now, engine = game
    player = uuid4()
    async with client:
        first = (await start(client, player, name="Ada")).json()
        now[0] += 45
        await submit(client, first, score=20)
        second = (await start(client, player, name="  Ada   Lovelace  ")).json()
        # A name change is visible even before the new round earns a score.
        assert (await client.get("/api/bug-hunt/leaderboard")).json()["entries"] == [
            {"rank": 1, "display_name": "Ada Lovelace", "score": 20}
        ]
        # A rejected overlapping round cannot append a name.
        assert (await start(client, player, name="Rejected")).status_code == 409
        now[0] += 45
        await submit(client, second, score=3)
        await start(client, player, name="Ada Lovelace")
        now[0] += 45
        await start(client, player, name="Ada")
        assert (await client.get("/api/bug-hunt/leaderboard")).json()["entries"] == [
            {"rank": 1, "display_name": "Ada", "score": 20}
        ]
    with engine.connect() as connection:
        user = connection.execute(select(users).where(users.c.id == str(player))).mappings().one()
        assert user["usernames"] == ["Ada", "Ada Lovelace", "Ada"]
        assert connection.execute(select(players.c.user_id).where(players.c.id == str(player))).scalar_one() == str(player)
        assert connection.execute(select(func.count()).select_from(users)).scalar_one() == 1


@pytest.mark.asyncio
async def test_same_name_does_not_merge_distinct_users(game):
    from app.users import users

    client, now, engine = game
    async with client:
        first = (await start(client, name="Ada")).json()
        second = (await start(client, name="Ada")).json()
        now[0] += 45
        await submit(client, first, score=10)
        await submit(client, second, score=5)
        entries = (await client.get("/api/bug-hunt/leaderboard")).json()["entries"]
        assert [entry["score"] for entry in entries] == [10, 5]
    with engine.connect() as connection:
        assert connection.execute(select(func.count()).select_from(users)).scalar_one() == 2


def test_legacy_schema_upgrade_preserves_names_scores_and_is_repeatable():
    from sqlalchemy import inspect, text
    from app.bug_hunt import BugHuntStore, StartRound, players
    from app.users import users

    engine = create_engine("sqlite://")
    player_id, session_id = str(uuid4()), str(uuid4())
    with engine.begin() as connection:
        connection.execute(text("PRAGMA foreign_keys=ON"))
        connection.execute(text("CREATE TABLE bug_hunt_players (id VARCHAR(36) PRIMARY KEY, display_name VARCHAR(24) NOT NULL)"))
        connection.execute(text("CREATE TABLE bug_hunt_sessions (id VARCHAR(36) PRIMARY KEY, player_id VARCHAR(36) NOT NULL REFERENCES bug_hunt_players(id), token_hash VARCHAR(64) NOT NULL, started_at FLOAT NOT NULL)"))
        connection.execute(text("CREATE TABLE bug_hunt_scores (session_id VARCHAR(36) PRIMARY KEY REFERENCES bug_hunt_sessions(id), score INTEGER NOT NULL, submitted_at FLOAT NOT NULL)"))
        connection.execute(text("INSERT INTO bug_hunt_players VALUES (:id, 'Legacy')"), {"id": player_id})
        connection.execute(text("INSERT INTO bug_hunt_sessions VALUES (:id, :player, :token, 0)"), {"id": session_id, "player": player_id, "token": "x" * 64})
        connection.execute(text("INSERT INTO bug_hunt_scores VALUES (:id, 19, 45)"), {"id": session_id})
    store = BugHuntStore(engine)
    assert store.leaderboard()["entries"] == [{"rank": 1, "display_name": "Legacy", "score": 19}]
    store.start(StartRound(player_id=player_id, display_name="Fresh"))
    BugHuntStore(engine).initialize()
    with engine.connect() as connection:
        assert connection.execute(select(users.c.usernames).where(users.c.id == player_id)).scalar_one() == ["Legacy", "Fresh"]
        assert connection.execute(select(players.c.user_id).where(players.c.id == player_id)).scalar_one() == player_id
        assert connection.execute(select(scores.c.score).where(scores.c.session_id == session_id)).scalar_one() == 19
        assert any(fk["referred_table"] == "users" for fk in inspect(connection).get_foreign_keys("bug_hunt_players"))
    assert store.leaderboard()["entries"] == [{"rank": 1, "display_name": "Fresh", "score": 19}]
    engine.dispose()


@pytest.mark.asyncio
async def test_leaderboard_reads_shared_history_even_if_legacy_name_is_stale(game):
    from app.users import remember_username

    client, now, engine = game
    player_id = uuid4()
    async with client:
        round = (await start(client, player_id, "Old name")).json()
        now[0] += 45
        await submit(client, round, score=8)
        with engine.begin() as connection:
            remember_username(connection, str(player_id), "Name from another game")
        assert (await client.get("/api/bug-hunt/leaderboard")).json()["entries"] == [
            {"rank": 1, "display_name": "Name from another game", "score": 8}
        ]
