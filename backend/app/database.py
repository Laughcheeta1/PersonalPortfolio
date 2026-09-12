from __future__ import annotations

import asyncio
import logging

from sqlalchemy import create_engine
from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def create_database_engine(database_url: str | None) -> Engine | None:
    """Create a lazy SQLAlchemy engine without requiring a live database."""

    if database_url is None or not database_url.strip():
        return None
    try:
        return create_engine(database_url, pool_pre_ping=True)
    except Exception:
        logger.warning(
            "Could not configure the analytics database; continuing without it.",
            exc_info=True,
        )
        return None


def _probe_database_connection(engine: Engine) -> None:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


async def connect_database(engine: Engine | None) -> None:
    """Probe the database in the background without making it a startup dependency."""

    if engine is None:
        return
    try:
        await asyncio.to_thread(_probe_database_connection, engine)
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.warning(
            "The analytics database is unavailable; continuing without telemetry.",
            exc_info=True,
        )


def dispose_database_engine(engine: Engine | None) -> None:
    """Release the database pool when the application shuts down."""

    if engine is not None:
        try:
            engine.dispose()
        except Exception:
            logger.warning(
                "Could not dispose the analytics database engine cleanly.",
                exc_info=True,
            )
