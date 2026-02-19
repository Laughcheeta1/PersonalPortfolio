import { useEffect, useRef, useState } from 'react';

import type { CategoryId } from '../information/models';
import { requestChatbotTurn } from './client';
import type { ConversationMessage } from './models';
import { createSpeakingAudioController, type SpeakingAudioController } from './speakingAudio';

type UsePortfolioChatbotParams = {
  onNavigateToCategory: (categoryId: CategoryId) => void;
};

export function usePortfolioChatbot(params: UsePortfolioChatbotParams) {
  const { onNavigateToCategory } = params;

  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatConversation, setChatConversation] = useState<ConversationMessage[]>([]);
  const [isPandaSpeaking, setIsPandaSpeaking] = useState(false);
  const speakingAudioRef = useRef<SpeakingAudioController | null>(null);

  useEffect(() => {
    speakingAudioRef.current = createSpeakingAudioController();
    return () => {
      speakingAudioRef.current?.stop();
      speakingAudioRef.current = null;
    };
  }, []);

  const startSpeaking = () => {
    setIsPandaSpeaking(true);
    speakingAudioRef.current?.start();
  };

  const stopSpeaking = () => {
    setIsPandaSpeaking(false);
    speakingAudioRef.current?.stop();
  };

  const sleep = (durationMs: number) =>
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, durationMs);
    });

  const getTypingDelayMs = (char: string): number => {
    if (char === '.' || char === ',' || char === '!' || char === '?' || char === ':') {
      return 110;
    }
    if (/\s/.test(char)) {
      return 28;
    }
    return 40;
  };

  const animateModelText = async (fullText: string): Promise<void> => {
    const normalized = fullText.trim();
    if (!normalized) {
      return;
    }

    setChatConversation((prev) => [...prev, { sender: 'model', message: '' }]);
    startSpeaking();

    let partial = '';
    for (const char of normalized) {
      partial += char;
      setChatConversation((prev) => {
        if (prev.length === 0) {
          return prev;
        }
        const next = [...prev];
        const messageIndex = next.length - 1;
        const lastMessage = next[messageIndex];
        if (lastMessage.sender !== 'model') {
          return prev;
        }
        next[messageIndex] = { ...lastMessage, message: partial };
        return next;
      });
      await sleep(getTypingDelayMs(char));
    }

    stopSpeaking();
    await sleep(80);
  };

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
      const { actions } = await requestChatbotTurn(nextConversation);

      for (const [index, action] of actions.entries()) {
        if (action.type === 'movement') {
          stopSpeaking();
          onNavigateToCategory(action.categoryId);
          await sleep(900);
          continue;
        }

        await animateModelText(action.message);
        const nextAction = actions[index + 1];
        if (nextAction?.type === 'text') {
          await sleep(500);
        }
      }
    } catch (error) {
      stopSpeaking();
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
      stopSpeaking();
      setIsSendingChat(false);
    }
  };

  return {
    isSendingChat,
    chatError,
    chatConversation,
    isPandaSpeaking,
    sendUserMessage,
  };
}
