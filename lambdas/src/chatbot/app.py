import json
from typing import Any

from core.portfolio_chatbot import PortfolioChatbot


def lambda_handler(_event: dict[str, Any], _context: Any) -> dict[str, Any]:
    chatbot = PortfolioChatbot()
    reply = chatbot.execute()
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"reply": reply}),
    }
