import type { ReactNode } from 'react';

import { getSafeExternalHref } from '../features/information/urlSafety';
import styles from './SafeBotMarkdown.module.css';

type SafeBotMarkdownProps = {
  text: string;
};

function parseInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const tokenPattern = /(\[[^\]]+\]\(([^)]+)\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIndex = 0;

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const nodeKey = `${keyPrefix}-${tokenIndex}`;

    if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(<code key={nodeKey}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={nodeKey}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(<em key={nodeKey}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (!linkMatch) {
        nodes.push(token);
      } else {
        const [, label, hrefRaw] = linkMatch;
        const safeHref = getSafeExternalHref(hrefRaw);
        if (!safeHref) {
          nodes.push(label);
        } else {
          nodes.push(
            <a key={nodeKey} href={safeHref} target="_blank" rel="noopener noreferrer">
              {label}
            </a>,
          );
        }
      }
    } else {
      nodes.push(token);
    }

    lastIndex = tokenPattern.lastIndex;
    tokenIndex += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export default function SafeBotMarkdown({ text }: SafeBotMarkdownProps) {
  const lines = text.split('\n');
  const elements: ReactNode[] = [];
  let listBuffer: string[] = [];
  let codeBlockBuffer: string[] = [];
  let inCodeBlock = false;

  const flushList = () => {
    if (listBuffer.length === 0) {
      return;
    }
    const key = `ul-${elements.length}`;
    elements.push(
      <ul key={key} className={styles.list}>
        {listBuffer.map((item, index) => (
          <li key={`${key}-${index}`}>{parseInlineMarkdown(item, `${key}-item-${index}`)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  };

  const flushCodeBlock = () => {
    if (codeBlockBuffer.length === 0) {
      elements.push(
        <pre key={`code-empty-${elements.length}`} className={styles.codeBlock}>
          <code />
        </pre>,
      );
      return;
    }
    const content = codeBlockBuffer.join('\n');
    elements.push(
      <pre key={`code-${elements.length}`} className={styles.codeBlock}>
        <code>{content}</code>
      </pre>,
    );
    codeBlockBuffer = [];
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.replace(/\r/g, '');
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushList();
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^[-*]\s+/, ''));
      return;
    }

    flushList();

    if (!trimmed) {
      elements.push(<div key={`spacer-${index}`} className={styles.spacer} aria-hidden="true" />);
      return;
    }

    if (/^###\s+/.test(trimmed)) {
      elements.push(
        <h3 key={`h3-${index}`} className={styles.heading3}>
          {parseInlineMarkdown(trimmed.replace(/^###\s+/, ''), `line-${index}`)}
        </h3>,
      );
      return;
    }

    elements.push(
      <p key={`p-${index}`} className={styles.paragraph}>
        {parseInlineMarkdown(line, `line-${index}`)}
      </p>,
    );
  });

  flushList();
  if (inCodeBlock) {
    flushCodeBlock();
  }

  return <div className={styles.container}>{elements}</div>;
}
