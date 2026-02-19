import type { CategoryId } from '../information/models';
import type { ChatbotStructuredResponse, ChatResponseAction } from './models';

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

function parseAction(action: unknown): ChatResponseAction {
  if (!isRecord(action)) {
    throw new Error('Chatbot response action must be an object.');
  }

  const actionType = action.action_type;
  if (actionType !== 'movement' && actionType !== 'text') {
    throw new Error('Chatbot response action_type must be movement or text.');
  }

  const categoryToMoveTo = action.category_to_move_to;
  const message = action.message;

  if (actionType === 'movement') {
    if (
      typeof categoryToMoveTo !== 'string' ||
      !NAVIGATION_CATEGORIES.has(categoryToMoveTo as CategoryId)
    ) {
      throw new Error('Movement action must include a valid category_to_move_to value.');
    }
  }

  if (actionType === 'text' && categoryToMoveTo !== null && categoryToMoveTo !== undefined) {
    throw new Error('Text action must not include category_to_move_to.');
  }

  if (message !== null && message !== undefined && typeof message !== 'string') {
    throw new Error('Action message must be a string when provided.');
  }

  return {
    action_type: actionType,
    category_to_move_to:
      typeof categoryToMoveTo === 'string' ? (categoryToMoveTo as CategoryId) : null,
    message: typeof message === 'string' ? message : null,
  };
}

export function parseChatbotStructuredResponse(payload: unknown): ChatbotStructuredResponse {
  if (!isRecord(payload) || !Array.isArray(payload.response)) {
    throw new Error('Chatbot response must include a response array.');
  }

  if (payload.response.length === 0) {
    throw new Error('Chatbot response array must contain at least one action.');
  }

  return {
    response: payload.response.map(parseAction),
  };
}
