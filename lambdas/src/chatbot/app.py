import json
import logging
import os
from typing import Any

from core.portfolio_chatbot import PortfolioChatbot
from pydantic import ValidationError
from models.request import ChatbotRequest

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.getLogger().setLevel(LOG_LEVEL)
LOGGER = logging.getLogger(__name__)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    LOGGER.debug("Lambda invoked. Event keys: %s", list(event.keys()))
    body_raw = event.get("body") or "{}"
    LOGGER.debug("Incoming body length: %s", len(body_raw))

    try:
        body = json.loads(body_raw)
    except json.JSONDecodeError:
        LOGGER.warning("Invalid JSON body.")
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Request body must be valid JSON."}),
        }

    try:
        request_payload = ChatbotRequest.model_validate(body)
        LOGGER.debug("Request validated. messages=%s", len(request_payload.messages))
    except ValidationError as exc:
        LOGGER.warning("Payload validation failed: %s", exc.errors())
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "error": "Invalid request payload.",
                    "detail": exc.errors(),
                }
            ),
        }

    chatbot = PortfolioChatbot()
    try:
        LOGGER.debug("Executing chatbot.")
        response_payload = chatbot.execute(messages=request_payload.messages)
        LOGGER.debug("Chatbot execution succeeded.")
    except Exception as exc:
        LOGGER.exception("Chatbot execution failed: %s", exc)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {"error": "Failed to generate chatbot response.", "detail": str(exc)}
            ),
        }

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(response_payload),
    }
