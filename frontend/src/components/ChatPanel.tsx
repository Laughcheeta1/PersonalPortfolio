import { useEffect, useRef, useState, type CSSProperties } from 'react';

import pandaMonkThinkingUrl from '../assets/images/panda_monk_thinking.png';
import type { ConversationMessage } from '../features/chatbot/models';
import styles from './ChatPanel.module.css';

type ChatPanelProps = {
  conversation: ConversationMessage[];
  isSending: boolean;
  error: string | null;
  onSendMessage: (message: string) => Promise<void>;
  panelStyle?: CSSProperties;
};

const ChatPanel = ({ conversation, isSending, error, onSendMessage, panelStyle }: ChatPanelProps) => {
  const [chatInput, setChatInput] = useState('');
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const log = logRef.current;
    if (!log) {
      return;
    }

    log.scrollTop = log.scrollHeight;
  }, [conversation]);

  const submitChatMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const userText = chatInput.trim();
    if (!userText || isSending) {
      return;
    }

    setChatInput('');
    await onSendMessage(userText);
  };

  return (
    <aside className={styles.panel} style={panelStyle} aria-label="Portfolio chatbot">
      <div className={styles.topline}>
        <span>Panda Monk</span>
        {isSending ? <span>Thinking...</span> : <span>Ready</span>}
      </div>

      {isSending ? (
        <div className={styles.thinkingImageWrap}>
          <img className={styles.thinkingImage} src={pandaMonkThinkingUrl} alt="Panda Monk thinking" />
        </div>
      ) : null}

      <div ref={logRef} className={styles.log}>
        {conversation.length === 0 ? (
          <p className={`${styles.bubble} ${styles.bubbleModel} ${styles.placeholder}`}>
            Ask about work, projects, skills, education, honors, or personal profile.
          </p>
        ) : (
          conversation.map((entry, index) => (
            <div
              key={`${entry.sender}-${index}`}
              className={`${styles.lineRow} ${entry.sender === 'user' ? styles.lineUser : styles.lineModel}`}
            >
              <p
                className={`${styles.bubble} ${
                  entry.sender === 'user' ? styles.bubbleUser : styles.bubbleModel
                }`}
              >
                <span className={styles.senderLabel}>{entry.sender === 'user' ? 'You' : 'Panda Monk'}</span>
                {entry.message}
              </p>
            </div>
          ))
        )}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <form className={styles.inputRow} onSubmit={submitChatMessage}>
        <input
          type="text"
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          placeholder="Ask a question..."
          disabled={isSending}
        />
        <button type="submit" disabled={isSending || !chatInput.trim()}>
          Send
        </button>
      </form>
    </aside>
  );
};

export default ChatPanel;
