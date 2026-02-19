import type { CategoryId } from '../../information/models';
import type { AvatarScreenAnchor } from '../models';
import { usePortfolioChatbot } from '../usePortfolioChatbot';
import { usePandaMonkChatboxLayout } from './usePandaMonkChatboxLayout';

type UsePandaMonkChatbotParams = {
  avatarAnchor: AvatarScreenAnchor;
  onNavigateToCategory: (categoryId: CategoryId) => void;
};

export function usePandaMonkChatbot(params: UsePandaMonkChatbotParams) {
  const { avatarAnchor, onNavigateToCategory } = params;
  const chatPanelStyle = usePandaMonkChatboxLayout({ avatarAnchor });
  const {
    isSendingChat,
    chatError,
    chatConversation,
    isPandaSpeaking,
    sendUserMessage,
  } = usePortfolioChatbot({
    onNavigateToCategory,
  });

  return {
    chatPanelStyle,
    isSendingChat,
    chatError,
    chatConversation,
    isPandaSpeaking,
    sendUserMessage,
  };
}
