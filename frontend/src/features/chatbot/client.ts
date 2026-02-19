import type { CategoryId } from '../information/models';

export type ChatSender = 'user' | 'model';

export type ConversationMessage = {
  sender: ChatSender;
  message: string;
};

type ChatActionType = 'movement' | 'text';

type ChatAction = {
  action_type: ChatActionType;
  category_to_move_to?: CategoryId | null;
  message?: string | null;
};

type ChatStructuredResponse = {
  response: ChatAction[];
};

export type ChatbotTurnResult = {
  movementTargets: CategoryId[];
  modelMessages: ConversationMessage[];
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';
const CHAT_API_URL = `${API_BASE_URL.replace(/\/+$/, '')}/chat`;

const NAVIGATION_CATEGORIES: ReadonlySet<CategoryId> = new Set([
  'work',
  'education',
  'projects',
  'honors',
  'skills',
  'personal',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toStructuredChatResponse(payload: unknown): ChatStructuredResponse | null {
  if (!isRecord(payload) || !Array.isArray(payload.response)) {
    return null;
  }

  const normalizedActions: ChatAction[] = [];
  for (const action of payload.response) {
    if (!isRecord(action)) {
      return null;
    }
    if (action.action_type !== 'movement' && action.action_type !== 'text') {
      return null;
    }

    const maybeCategory = action.category_to_move_to;
    const maybeMessage = action.message;

    normalizedActions.push({
      action_type: action.action_type,
      category_to_move_to:
        typeof maybeCategory === 'string' && NAVIGATION_CATEGORIES.has(maybeCategory as CategoryId)
          ? (maybeCategory as CategoryId)
          : null,
      message: typeof maybeMessage === 'string' ? maybeMessage : null,
    });
  }

  return { response: normalizedActions };
}

export async function requestChatbotTurn(
  conversation: ConversationMessage[],
): Promise<ChatbotTurnResult> {
  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: conversation }),
  });

  const payload: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      isRecord(payload) && typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`,
    );
  }

  const structured = toStructuredChatResponse(payload);
  if (!structured) {
    throw new Error('Invalid structured response received from chatbot API.');
  }

  const movementTargets: CategoryId[] = [];
  const modelMessages: ConversationMessage[] = [];

  for (const action of structured.response) {
    if (action.action_type === 'movement' && action.category_to_move_to) {
      movementTargets.push(action.category_to_move_to);
    }
    if (action.message && action.message.trim()) {
      modelMessages.push({ sender: 'model', message: action.message.trim() });
    }
  }

  return { movementTargets, modelMessages };
}
