import json
from typing import Any

from core.portfolio_chatbot import PortfolioChatbot
from pydantic import ValidationError
from models.request import ChatbotRequest


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    body_raw = event.get("body") or "{}"

    try:
        body = json.loads(body_raw)
    except json.JSONDecodeError:
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Request body must be valid JSON."}),
        }

    try:
        request_payload = ChatbotRequest.model_validate(body)
    except ValidationError as exc:
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
        response_payload = chatbot.execute(
            messages=[message.model_dump() for message in request_payload.messages]
        )
    except Exception as exc:
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
