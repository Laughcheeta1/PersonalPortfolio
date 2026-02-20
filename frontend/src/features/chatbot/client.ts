import { postChatConversation } from './api';
import { toChatbotTurnResult } from './mapper';
import type { ChatbotTurnResult, ConversationMessage } from './models';
import { parseChatbotStructuredResponse } from './schema';

export type { ConversationMessage } from './models';

export async function requestChatbotTurn(
  conversation: ConversationMessage[],
): Promise<ChatbotTurnResult> {
  const payload = await postChatConversation(conversation);
  const structuredResponse = parseChatbotStructuredResponse(payload);
  return toChatbotTurnResult(structuredResponse);
}
