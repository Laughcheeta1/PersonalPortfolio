import type { CategoryId } from '../information/models';

export type ChatSender = 'user' | 'model';

export type ConversationMessage = {
  sender: ChatSender;
  message: string;
};

export type ChatActionType = 'movement' | 'text' | 'main_page';

export type ChatSubcategoryId =
  | 'companies'
  | 'entrepreneurship'
  | 'independent-work'
  | 'university'
  | 'courses'
  | 'personal-projects'
  | 'work-projects'
  | 'awards'
  | 'honors'
  | 'skills-list'
  | 'profile'
  | 'hobbies'
  | 'languages';

export type ChatResponseAction = {
  action_type: ChatActionType;
  category_to_move_to?: CategoryId | null;
  subcategory_to_move_to?: ChatSubcategoryId | null;
  message?: string | null;
};

export type ChatbotStructuredResponse = {
  response: ChatResponseAction[];
};

export type ChatbotTurnAction =
  | {
      type: 'movement';
      categoryId: CategoryId;
      subcategoryId?: ChatSubcategoryId;
    }
  | {
      type: 'main_page';
    }
  | {
      type: 'text';
      message: string;
    };

export type ChatbotTurnResult = {
  actions: ChatbotTurnAction[];
};

export type AvatarScreenAnchor = {
  x: number;
  y: number;
  visible: boolean;
};
