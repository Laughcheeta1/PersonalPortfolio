import type { ConversationMessage } from './models';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';
const CHAT_API_URL = `${API_BASE_URL.replace(/\/+$/, '')}/chat`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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
    throw new Error(
      isRecord(payload) && typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`,
    );
  }

  return payload;
}
