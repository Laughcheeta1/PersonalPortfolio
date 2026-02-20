import { useEffect } from 'react';

import type { SceneNavigationTarget } from '../../information/models';
import type { AvatarScreenAnchor } from '../models';
import { usePortfolioChatbot } from '../usePortfolioChatbot';
import { usePandaMonkChatboxLayout } from './usePandaMonkChatboxLayout';

type UsePandaMonkChatbotParams = {
  avatarAnchor: AvatarScreenAnchor;
  onNavigateToCategory: (target: Pick<SceneNavigationTarget, 'categoryId' | 'subcategoryId'>) => void;
  onNavigateToMainPage: () => void;
  onPandaSpeakingChange?: (speaking: boolean) => void;
};

export function usePandaMonkChatbot(params: UsePandaMonkChatbotParams) {
  const { avatarAnchor, onNavigateToCategory, onNavigateToMainPage, onPandaSpeakingChange } = params;
  const chatPanelStyle = usePandaMonkChatboxLayout({ avatarAnchor });
  const {
    isSendingChat,
    chatError,
    chatConversation,
    isPandaSpeaking,
    sendUserMessage,
  } = usePortfolioChatbot({
    onNavigateToCategory,
    onNavigateToMainPage,
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
