import type { ConversationMessage } from './models';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';
const CHAT_API_URL = `${API_BASE_URL}/chat`;

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

export async function postChatConversation(
  conversation: ConversationMessage[],
): Promise<unknown> {
  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: conversation }),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Chatbot API returned invalid JSON.');
  }

  if (!response.ok) {
    throw new Error(formatApiError(payload, response.status));
  }

  return payload;
}
