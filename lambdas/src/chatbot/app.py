import json
import logging
import os
from typing import Any

from core.errors import ChatbotHttpError
from core.portfolio_chatbot import PortfolioChatbot
from pydantic import ValidationError
from models.request import ChatbotRequest

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.getLogger().setLevel(LOG_LEVEL)
LOGGER = logging.getLogger(__name__)


def _json_response(status_code: int, payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "content-type,authorization",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        "body": json.dumps(payload),
    }


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    LOGGER.debug("Lambda invoked. Event keys: %s", list(event.keys()))
    body_raw = event.get("body") or "{}"
    LOGGER.debug("Incoming body length: %s", len(body_raw))

    try:
        body = json.loads(body_raw)
    except json.JSONDecodeError:
        LOGGER.warning("Invalid JSON body.")
        return _json_response(400, {"error": "Request body must be valid JSON."})

    try:
        request_payload = ChatbotRequest.model_validate(body)
        LOGGER.debug("Request validated. messages=%s", len(request_payload.messages))
    except ValidationError as exc:
        LOGGER.warning("Payload validation failed: %s", exc.errors())
        return _json_response(
            400,
            {
                "error": "Invalid request payload.",
                "detail": exc.errors(),
            },
        )

    try:
        chatbot = PortfolioChatbot()
        LOGGER.debug("Executing chatbot.")
        response_payload = chatbot.execute(messages=request_payload.messages)
        LOGGER.debug("Chatbot execution succeeded.")
    except ChatbotHttpError as exc:
        LOGGER.warning(
            "Chatbot returned handled HTTP error. status=%s error_code=%s",
            exc.status_code,
            exc.error_code,
        )
        return _json_response(exc.status_code, exc.to_payload())
    except Exception as exc:
        LOGGER.exception("Chatbot execution failed: %s", exc)
        literal_error = f"{exc.__class__.__name__}: {exc}"
        return _json_response(
            500,
            {
                "error": "Failed to generate chatbot response.",
                "message": literal_error,
            },
        )

    return _json_response(200, response_payload)
