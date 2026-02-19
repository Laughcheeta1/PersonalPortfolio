import json
import os
from typing import Any

from core.portfolio_chatbot import PortfolioChatbot
from models.prompt import Prompt
from llm_providers.groq_model import GroqModel
from llm_providers.openai_model import OpenAIModel


def _build_chatbot() -> PortfolioChatbot:
    system_prompt = (
        "You are the portfolio assistant. Be concise, helpful, and factual. "
        "Use the provided conversation payload to answer."
    )
    user_prompt = "Conversation payload: {messages}"

    llm_models = [
        OpenAIModel(
            model_name=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
            reasoning_effort=os.getenv("OPENAI_REASONING_EFFORT") or None,
            temperature=0.2,
            top_p=1.0,
        ),
        GroqModel(
            model_name="openai/gpt-oss-120b",
            reasoning_effort="medium",
            temperature=0.2,
            top_p=1.0,
        ),
        GroqModel(
            model_name="meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature=0.2,
            top_p=1.0,
        ),
    ]

    return PortfolioChatbot(
        llm_models=llm_models,
        prompt=Prompt(system_prompt=system_prompt, user_prompt=user_prompt),
    )


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

    raw_messages = body.get("messages")
    if raw_messages is not None:
        if not isinstance(raw_messages, list) or not all(
            isinstance(item, str) for item in raw_messages
        ):
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps(
                    {"error": "Field 'messages' must be a list of strings."}
                ),
            }
        messages = [item.strip() for item in raw_messages if item.strip()]
    else:
        user_message = (body.get("message") or "").strip()
        messages = [user_message] if user_message else []

    if not messages:
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {"error": "Provide either 'message' or 'messages' with content."}
            ),
        }

    try:
        chatbot = _build_chatbot()
        reply = chatbot._get_response(messages=messages)
    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "error": "Failed to generate chatbot response.",
                    "detail": str(exc),
                }
            ),
        }

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"reply": reply}),
    }
