import type { ConversationMessage } from './models';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.trim().replace(/\/+$/, '');
type ChatbotErrorI18nKey = 'chat.error.generic' | 'chat.error.rateLimit' | 'chat.error.creditLimit';

export class ChatbotApiError extends Error {
  readonly status: number;
  readonly errorCode: string | null;
  readonly i18nKey: ChatbotErrorI18nKey;

  constructor(
    message: string,
    status: number,
    errorCode: string | null = null,
    i18nKey: ChatbotErrorI18nKey = 'chat.error.generic',
  ) {
    super(message);
    this.name = 'ChatbotApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.i18nKey = i18nKey;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function formatApiError(payload: unknown, status: number): string {
  if (status >= 500) {
    return 'Chatbot service is temporarily unavailable. Please try again shortly.';
  }

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

function getErrorI18nKey(status: number, errorCode: string | null): ChatbotErrorI18nKey {
  if (errorCode === 'groq_credit_limit_exceeded' || status === 402) {
    return 'chat.error.creditLimit';
  }
  if (errorCode === 'api_gateway_rate_limited' || status === 429) {
    return 'chat.error.rateLimit';
  }
  return 'chat.error.generic';
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
    const errorCode = getErrorCode(payload);
    throw new ChatbotApiError(
      formatApiError(payload, response.status),
      response.status,
      errorCode,
      getErrorI18nKey(response.status, errorCode),
    );
  }

  return payload;
}
