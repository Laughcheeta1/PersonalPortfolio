import json
from typing import Any


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

    user_message = (body.get("message") or "").strip()

    if not user_message:
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Field 'message' is required."}),
        }

    response = {
        "reply": f"Echo: {user_message}",
    }

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(response),
    }
