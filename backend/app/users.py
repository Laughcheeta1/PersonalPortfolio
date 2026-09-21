"""Shared visitor profiles, identified by UUID rather than display name."""
from sqlalchemy import JSON, Column, MetaData, Table, Uuid, select, text, update
from sqlalchemy.dialects.postgresql import JSONB, insert as postgres_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.engine import Connection

metadata = MetaData()
users = Table(
    "users", metadata,
    Column("id", Uuid(as_uuid=False), primary_key=True),
    Column("usernames", JSON().with_variant(JSONB(), "postgresql"), nullable=False, server_default=text("'[]'")),
)


def ensure_user(connection: Connection, user_id: str, usernames: list[str]) -> None:
    """Create without replacing history if another game already knows this visitor."""
    insert = postgres_insert if connection.dialect.name == "postgresql" else sqlite_insert
    connection.execute(insert(users).values(id=user_id, usernames=usernames).on_conflict_do_nothing(index_elements=[users.c.id]))


def remember_username(connection: Connection, user_id: str, name: str) -> None:
    """Serialize name changes across games; retain returns to previously used names."""
    ensure_user(connection, user_id, [])
    names = connection.execute(
        select(users.c.usernames).where(users.c.id == user_id).with_for_update()
    ).scalar_one()
    if not names or names[-1] != name:
        connection.execute(update(users).where(users.c.id == user_id).values(usernames=[*names, name]))
