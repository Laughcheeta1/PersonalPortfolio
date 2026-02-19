import type { ChatbotStructuredResponse, ChatbotTurnResult } from './models';

export function toChatbotTurnResult(
  structuredResponse: ChatbotStructuredResponse,
): ChatbotTurnResult {
  const movementTargets: ChatbotTurnResult['movementTargets'] = [];
  const modelMessages: ChatbotTurnResult['modelMessages'] = [];

  for (const action of structuredResponse.response) {
    if (action.action_type === 'movement' && action.category_to_move_to) {
      movementTargets.push(action.category_to_move_to);
    }

    if (action.message && action.message.trim()) {
      modelMessages.push({ sender: 'model', message: action.message.trim() });
    }
  }

  return { movementTargets, modelMessages };
}
