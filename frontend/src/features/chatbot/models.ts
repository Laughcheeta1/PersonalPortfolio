import type { CategoryId } from '../information/models';

export type ChatSender = 'user' | 'model';

export type ConversationMessage = {
  sender: ChatSender;
  message: string;
};

export type ChatActionType = 'movement' | 'text';

export type ChatResponseAction = {
  action_type: ChatActionType;
  category_to_move_to?: CategoryId | null;
  message?: string | null;
};

export type ChatbotStructuredResponse = {
  response: ChatResponseAction[];
};

export type ChatbotTurnResult = {
  movementTargets: CategoryId[];
  modelMessages: ConversationMessage[];
};

export type AvatarScreenAnchor = {
  x: number;
  y: number;
  visible: boolean;
};
