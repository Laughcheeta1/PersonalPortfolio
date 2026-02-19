import { useState } from 'react';

import type { ConversationMessage } from '../features/chatbot/models';
import styles from './ChatPanel.module.css';

type ChatPanelProps = {
  conversation: ConversationMessage[];
  isSending: boolean;
  error: string | null;
  onSendMessage: (message: string) => Promise<void>;
};

const ChatPanel = ({ conversation, isSending, error, onSendMessage }: ChatPanelProps) => {
  const [chatInput, setChatInput] = useState('');

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
    <aside className={styles.panel} aria-label="Portfolio chatbot">
      <div className={styles.topline}>
        <span>Portfolio Guide</span>
        {isSending ? <span>Thinking...</span> : <span>Ready</span>}
      </div>

      <div className={styles.log}>
        {conversation.length === 0 ? (
          <p className={styles.placeholder}>
            Ask about work, projects, skills, education, honors, or personal profile.
          </p>
        ) : (
          conversation.map((entry, index) => (
            <p
              key={`${entry.sender}-${index}`}
              className={`${styles.line} ${entry.sender === 'user' ? styles.lineUser : styles.lineModel}`}
            >
              <strong>{entry.sender === 'user' ? 'You:' : 'Guide:'}</strong> {entry.message}
            </p>
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
