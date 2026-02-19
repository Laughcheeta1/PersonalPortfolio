import { useState } from 'react';

import type { CategoryId } from '../information/models';
import { requestChatbotTurn } from './client';
import type { ConversationMessage } from './models';

type UsePortfolioChatbotParams = {
  onNavigateToCategory: (categoryId: CategoryId) => void;
};

export function usePortfolioChatbot(params: UsePortfolioChatbotParams) {
  const { onNavigateToCategory } = params;

  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatConversation, setChatConversation] = useState<ConversationMessage[]>([]);

  const sendUserMessage = async (rawMessage: string): Promise<void> => {
    const userText = rawMessage.trim();
    if (!userText || isSendingChat) {
      return;
    }

    const nextConversation: ConversationMessage[] = [
      ...chatConversation,
      { sender: 'user', message: userText },
    ];

    setChatConversation(nextConversation);
    setChatError(null);
    setIsSendingChat(true);

    try {
      const { movementTargets, modelMessages } = await requestChatbotTurn(nextConversation);

      for (const categoryId of movementTargets) {
        onNavigateToCategory(categoryId);
      }

      if (modelMessages.length > 0) {
        setChatConversation((prev) => [...prev, ...modelMessages]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Chat request failed.';
      setChatError(errorMessage);
      setChatConversation((prev) => [
        ...prev,
        {
          sender: 'model',
          message: `I ran into an error while calling the chatbot API: ${errorMessage}`,
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return {
    isSendingChat,
    chatError,
    chatConversation,
    sendUserMessage,
  };
}
