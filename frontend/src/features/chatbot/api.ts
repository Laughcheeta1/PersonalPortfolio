import type { ConversationMessage } from './models';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.trim().replace(/\/+$/, '');

export class ChatbotApiError extends Error {
  readonly status: number;
  readonly errorCode: string | null;

  constructor(message: string, status: number, errorCode: string | null = null) {
    super(message);
    this.name = 'ChatbotApiError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function formatApiError(payload: unknown, status: number): string {
  if (!isRecord(payload)) {
    return `Chatbot API request failed with status ${status}.`;
  }

  const detail =
    typeof payload.detail === 'string'
      ? payload.detail
      : typeof payload.message === 'string'
        ? payload.message
        : null;
  const error = typeof payload.error === 'string' ? payload.error : null;

  if (error && detail) {
    return `${error} ${detail}`;
  }
  if (detail) {
    return detail;
  }
  if (error) {
    return error;
  }

  return `Chatbot API request failed with status ${status}.`;
}

function getErrorCode(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }
  return typeof payload.error_code === 'string' ? payload.error_code : null;
}

export async function postChatConversation(
  conversation: ConversationMessage[],
): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: conversation }),
  });

  const responseText = await response.text();
  let payload: unknown = null;
  if (responseText.trim()) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        throw new Error('Chatbot API returned invalid JSON.');
      }
      payload = { message: responseText };
    }
  }

  if (!response.ok) {
    throw new ChatbotApiError(
      formatApiError(payload, response.status),
      response.status,
      getErrorCode(payload),
    );
  }

  return payload;
}
