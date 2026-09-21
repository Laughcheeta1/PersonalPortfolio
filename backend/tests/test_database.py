from typing import cast

import pytest
from sqlalchemy.engine import Engine

from app.database import (
    connect_database,
    create_database_engine,
    dispose_database_engine,
)


def test_database_engine_is_disabled_without_a_url() -> None:
    assert create_database_engine(None) is None
    assert create_database_engine("  ") is None


def test_database_engine_uses_the_configured_sqlalchemy_url() -> None:
    engine = create_database_engine(
        "postgresql+psycopg://username:password@localhost:5432/portfolio"
    )

    assert isinstance(engine, Engine)
    assert engine.url.drivername == "postgresql+psycopg"

    dispose_database_engine(engine)


@pytest.mark.asyncio
async def test_database_connection_failure_is_non_fatal() -> None:
    class FailingEngine:
        def connect(self) -> None:
            raise RuntimeError("database is offline")

    await connect_database(cast(Engine, FailingEngine()))
