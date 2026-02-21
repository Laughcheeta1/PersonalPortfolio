import { useEffect } from 'react';

import type { SceneNavigationTarget } from '../../information/models';
import type { AvatarScreenAnchor } from '../models';
import { usePortfolioChatbot } from '../usePortfolioChatbot';
import { usePandaMonkChatboxLayout } from './usePandaMonkChatboxLayout';
import type { PandaMonkAvatarState } from '../scene/PandaMonkAvatar';

type UsePandaMonkChatbotParams = {
  avatarAnchor: AvatarScreenAnchor;
  onNavigateToCategory: (target: Pick<SceneNavigationTarget, 'categoryId' | 'subcategoryId'>) => void;
  onNavigateToMainPage: () => void;
  onPandaStateChange?: (state: PandaMonkAvatarState) => void;
};

export function usePandaMonkChatbot(params: UsePandaMonkChatbotParams) {
  const { avatarAnchor, onNavigateToCategory, onNavigateToMainPage, onPandaStateChange } = params;
  const chatPanelStyle = usePandaMonkChatboxLayout({ avatarAnchor });
  const {
    isSendingChat,
    isAwaitingChatResponse,
    chatError,
    chatConversation,
    isPandaSpeaking,
    sendUserMessage,
  } = usePortfolioChatbot({
    onNavigateToCategory,
    onNavigateToMainPage,
  });

  useEffect(() => {
    const avatarState: PandaMonkAvatarState = isAwaitingChatResponse
      ? 'thinking'
      : isPandaSpeaking
        ? 'speaking'
        : 'idle';
    onPandaStateChange?.(avatarState);
  }, [isAwaitingChatResponse, isPandaSpeaking, onPandaStateChange]);

  return {
    chatPanelStyle,
    isSendingChat,
    isAwaitingChatResponse,
    chatError,
    chatConversation,
    isPandaSpeaking,
    sendUserMessage,
  };
}
