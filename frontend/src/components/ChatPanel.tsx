import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { useI18n } from '../features/i18n/useI18n';
import type { ConversationMessage } from '../features/chatbot/models';
import SafeBotMarkdown from './SafeBotMarkdown';
import styles from './ChatPanel.module.css';

type ChatPanelProps = {
  conversation: ConversationMessage[];
  isSending: boolean;
  isAwaitingResponse?: boolean;
  error: string | null;
  onSendMessage: (message: string) => Promise<void>;
  panelStyle?: CSSProperties;
};

const ChatPanel = ({
  conversation,
  isSending,
  isAwaitingResponse = false,
  error,
  onSendMessage,
  panelStyle,
}: ChatPanelProps) => {
  const { t } = useI18n();
  const [chatInput, setChatInput] = useState('');
  const logRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const suggestedPrompts = [
    t('chat.prompt.tour'),
    t('chat.prompt.work'),
    t('chat.prompt.profile'),
  ];

  const sanitizeUserText = (rawValue: string): string => {
    const filtered = Array.from(rawValue)
      .filter((char) => {
        const code = char.charCodeAt(0);
        return code >= 32 && code !== 127;
      })
      .join('');
    return filtered.trim();
  };

  const isNearBottom = (container: HTMLDivElement): boolean =>
    container.scrollHeight - container.scrollTop - container.clientHeight <= 24;

  useEffect(() => {
    const log = logRef.current;
    if (!log) {
      return;
    }

    const handleScroll = () => {
      const nearBottom = isNearBottom(log);
      if (isAwaitingResponse) {
        shouldStickToBottomRef.current = nearBottom;
        return;
      }
      shouldStickToBottomRef.current = true;
    };

    log.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      log.removeEventListener('scroll', handleScroll);
    };
  }, [isAwaitingResponse]);

  useEffect(() => {
    const log = logRef.current;
    if (!log) {
      return;
    }

    const lastMessage = conversation[conversation.length - 1];
    const userJustSentMessage = lastMessage?.sender === 'user';
    const shouldAutoScroll =
      userJustSentMessage ||
      !isAwaitingResponse ||
      shouldStickToBottomRef.current ||
      isNearBottom(log);
    if (!shouldAutoScroll) {
      return;
    }

    log.scrollTop = log.scrollHeight;
  }, [conversation, isAwaitingResponse]);

  const submitChatMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const userText = sanitizeUserText(chatInput);
    if (!userText || isSending) {
      return;
    }

    setChatInput('');
    await onSendMessage(userText);
  };

  const sendSuggestedMessage = async (message: string) => {
    if (isSending) {
      return;
    }
    await onSendMessage(message);
  };

  return (
    <aside className={styles.panel} style={panelStyle} aria-label={t('chat.aria')}>
      <div className={styles.topline}>
        <span>{t('chat.title')}</span>
      </div>

      <div ref={logRef} className={styles.log}>
        {conversation.length === 0 ? (
          <div className={styles.starterGrid} aria-label={t('chat.suggested.aria')}>
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className={styles.starterCard}
                onClick={() => {
                  void sendSuggestedMessage(prompt);
                }}
                disabled={isSending}
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        {conversation.map((entry, index) => (
          <div
            key={`${entry.sender}-${index}`}
            className={`${styles.lineRow} ${entry.sender === 'user' ? styles.lineUser : styles.lineModel}`}
          >
            <div
              className={`${styles.bubble} ${
                entry.sender === 'user' ? styles.bubbleUser : styles.bubbleModel
              }`}
            >
              <span className={styles.senderLabel}>
                {entry.sender === 'user' ? t('chat.sender.you') : t('chat.sender.bot')}
              </span>
              {entry.sender === 'model' ? (
                <SafeBotMarkdown text={entry.message} />
              ) : (
                <span className={styles.rawUserMessage}>{entry.message}</span>
              )}
            </div>
          </div>
        ))}
        {isAwaitingResponse ? (
          <div className={`${styles.lineRow} ${styles.lineModel}`}>
            <div className={`${styles.bubble} ${styles.bubbleModel} ${styles.thinkingBubble}`} aria-live="polite">
              <span className={styles.senderLabel}>{t('chat.sender.bot')}</span>
              <span className={styles.thinkingDots} aria-label={t('chat.thinking.aria')}>
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <form className={styles.inputRow} onSubmit={submitChatMessage}>
        <input
          type="text"
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          placeholder={t('chat.input.placeholder')}
          disabled={isSending}
        />
        <button type="submit" disabled={isSending || !chatInput.trim()}>
          {t('chat.send')}
        </button>
      </form>
    </aside>
  );
};

export default ChatPanel;
