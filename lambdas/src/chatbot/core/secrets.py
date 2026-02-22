from __future__ import annotations

import json
import logging
import boto3
from botocore.exceptions import BotoCoreError, ClientError

LOGGER = logging.getLogger(__name__)


def resolve_secret_value(*, secret_id: str, json_key: str) -> str:
    """Read a JSON key from a specific Secrets Manager secret."""
    try:
        client = boto3.client("secretsmanager")
        response = client.get_secret_value(SecretId=secret_id)
    except (BotoCoreError, ClientError) as exc:
        LOGGER.warning("Failed to read secret '%s': %s", secret_id, exc)
        return ""

    secret_string = response.get("SecretString")
    if not isinstance(secret_string, str):
        LOGGER.warning("Secret '%s' does not have a SecretString value.", secret_id)
        return ""

    try:
        parsed_secret = json.loads(secret_string)
    except json.JSONDecodeError:
        return secret_string.strip()

    if isinstance(parsed_secret, dict):
        value = parsed_secret.get(json_key)
        if isinstance(value, str):
            return value.strip()

    return ""
