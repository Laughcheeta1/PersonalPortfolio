import { useEffect } from 'react';

import type { CategoryId } from '../../information/models';
import type { AvatarScreenAnchor } from '../models';
import { usePortfolioChatbot } from '../usePortfolioChatbot';
import { usePandaMonkChatboxLayout } from './usePandaMonkChatboxLayout';

type UsePandaMonkChatbotParams = {
  avatarAnchor: AvatarScreenAnchor;
  onNavigateToCategory: (categoryId: CategoryId) => void;
  onPandaSpeakingChange?: (speaking: boolean) => void;
};

export function usePandaMonkChatbot(params: UsePandaMonkChatbotParams) {
  const { avatarAnchor, onNavigateToCategory, onPandaSpeakingChange } = params;
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

  useEffect(() => {
    onPandaSpeakingChange?.(isPandaSpeaking);
  }, [isPandaSpeaking, onPandaSpeakingChange]);

  return {
    chatPanelStyle,
    isSendingChat,
    chatError,
    chatConversation,
    isPandaSpeaking,
    sendUserMessage,
  };
}
