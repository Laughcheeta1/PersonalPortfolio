import type { ChatbotStructuredResponse, ChatbotTurnResult } from './models';

export function toChatbotTurnResult(
  structuredResponse: ChatbotStructuredResponse,
): ChatbotTurnResult {
  const actions: ChatbotTurnResult['actions'] = [];

  for (const action of structuredResponse.response) {
    if (action.action_type === 'movement' && action.category_to_move_to) {
      actions.push({
        type: 'movement',
        categoryId: action.category_to_move_to,
        subcategoryId: action.subcategory_to_move_to ?? undefined,
      });
      continue;
    }

    if (action.action_type === 'text' && action.message && action.message.trim()) {
      actions.push({
        type: 'text',
        message: action.message.trim(),
      });
    }
  }

  return { actions };
}
