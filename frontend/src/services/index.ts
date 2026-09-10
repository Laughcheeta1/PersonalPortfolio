import DOMPurify from 'dompurify';
import { landmarks, type LandmarkId } from '../world/registry';
import { panelDocumentFor } from '../content/panels';
import { t } from '../i18n';

export type PanelDefinition = (
  | { type: 'html'; html: string }
  | { type: 'iframe'; url: string; title: string }
  | { type: 'none' }
) & { localize?: boolean };
export type ServiceErrorCode = 'unavailable' | 'invalid-response' | 'invalid-request' | 'cancelled';
export class ServiceError extends Error {
  constructor(public readonly code: ServiceErrorCode, message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}
export interface ChatReply { message: string; destination_object_id: LandmarkId | null }
export interface ChatMessage { role: 'user' | 'assistant'; content: string }
export const MAX_CHAT_MESSAGE_LENGTH = 300;
export const MAX_CHAT_HISTORY_MESSAGES = 10;
export interface ChatService {
  send(message: string, history: readonly ChatMessage[], signal?: AbortSignal): Promise<ChatReply>;
}
export interface PanelContentService {
  get(panelId: string, signal?: AbortSignal): Promise<PanelDefinition>;
}
export interface HistoryStore {
  load(): ChatMessage[];
  save(messages: readonly ChatMessage[]): void;
  clear(): void;
}

export const apiBaseUrl = ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
export const apiOrigin = new URL(apiBaseUrl).origin;

function characterCount(value: string): number {
  return Array.from(value).length;
}

export function validateChatMessage(value: string): string {
  const message = value.trim();
  if (!message) throw new ServiceError('invalid-request', 'Message cannot be blank.');
  if (characterCount(message) > MAX_CHAT_MESSAGE_LENGTH) {
    throw new ServiceError(
      'invalid-request',
      `Messages must be ${MAX_CHAT_MESSAGE_LENGTH} characters or fewer.`,
    );
  }
  return message;
}

function isStoredChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0 &&
    characterCount(message.content.trim()) <= MAX_CHAT_MESSAGE_LENGTH
  );
}

function normalizeHistory(history: readonly ChatMessage[]): ChatMessage[] {
  const normalized = history.map(message => {
    if (!isStoredChatMessage(message)) {
      throw new ServiceError('invalid-request', 'The conversation contains an invalid message.');
    }
    return { role: message.role, content: validateChatMessage(message.content) };
  });
  return normalized.slice(-MAX_CHAT_HISTORY_MESSAGES);
}

export function validateChatReply(value: unknown): ChatReply {
  if (!value || typeof value !== 'object') throw new ServiceError('invalid-response', 'The guide received an invalid reply.');
  const reply = value as Record<string, unknown>;
  if (
    typeof reply.message !== 'string' ||
    !reply.message.trim() ||
    characterCount(reply.message.trim()) > MAX_CHAT_MESSAGE_LENGTH ||
    !(reply.destination_object_id === null || landmarks.some(item => item.id === reply.destination_object_id))
  ) {
    throw new ServiceError('invalid-response', 'The guide received an unknown destination or invalid message.');
  }
  return { message: reply.message.trim(), destination_object_id: reply.destination_object_id as LandmarkId | null };
}

/** Keep sanitization at the trust boundary when replacing mocks with HTTP content. */
export function sanitizePanelHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['iframe', 'style', 'script'],
    FORBID_ATTR: ['style'],
  });
}

export function validatePanelDefinition(value: unknown): PanelDefinition {
  if (!value || typeof value !== 'object') throw new ServiceError('invalid-response', 'The notebook returned an invalid panel.');
  const panel = value as Record<string, unknown>;
  if (panel.type === 'none') return { type: 'none', localize: false };
  if (panel.type === 'html' && typeof panel.html === 'string') return { type: 'html', html: panel.html, localize: panel.localize === true };
  if (panel.type === 'iframe' && typeof panel.url === 'string' && typeof panel.title === 'string') {
    return { type: 'iframe', url: panel.url, title: panel.title, localize: panel.localize === true };
  }
  throw new ServiceError('invalid-response', 'The notebook returned an invalid panel.');
}

function checkSignal(signal?: AbortSignal): void {
  if (signal?.aborted) throw new ServiceError('cancelled', 'Request cancelled.');
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

async function readApiPayload(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { throw new ServiceError('invalid-response', 'The backend returned invalid JSON.'); }
}

function apiErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const body=payload as Record<string, unknown>;
    if (typeof body.detail === 'string') return body.detail;
    if (typeof body.message === 'string') return body.message;
  }
  return `The backend request failed (${status}).`;
}

export function createPanelContentService(): PanelContentService {
  return {
    async get(panelId, signal) {
      checkSignal(signal);
      const document = panelDocumentFor(panelId);
      if (!document) return { type: 'none', localize: false };
      return { type: 'iframe', url: `${apiBaseUrl}${document.url}`, title: document.title, localize: false };
    },
  };
}

export function createChatService(): ChatService {
  return {
    async send(message, _history, signal) {
      checkSignal(signal);
      const normalized = validateChatMessage(message).toLocaleLowerCase();
      const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
      const matches = (term: string) => term.includes('-') ? normalized.includes(term) : tokens.includes(term);
      const destination = landmarks.find(item => matches(item.id) || matches(item.model) || [item.title,t(item.title)].some(title=>title.toLocaleLowerCase().split(/\W+/).some(word => word.length > 3 && tokens.includes(word))));
      return validateChatReply(destination
        ? { message: t("Let's head to {title}. Follow me along the paths! {subtitle} Take a look behind the landmark, too—there is another side to every story.",{title:t(destination.title),subtitle:t(destination.subtitle)}), destination_object_id: destination.id }
        : { message: t("Welcome to my little island! Ask me about Santiago or choose a destination on the island map."), destination_object_id: null });
    },
  };
}

export function createBackendChatService(baseUrl = apiBaseUrl, fallback: ChatService = createChatService()): ChatService {
  const remote: ChatService = {
    async send(message, history, signal) {
      checkSignal(signal);
      const normalizedMessage = validateChatMessage(message);
      const normalizedHistory = normalizeHistory(history);
      const conversation = (
        normalizedHistory.length &&
        normalizedHistory.at(-1)?.role === 'user' &&
        normalizedHistory.at(-1)?.content === normalizedMessage
          ? normalizedHistory
          : [...normalizedHistory, { role: 'user' as const, content: normalizedMessage }]
      ).slice(-MAX_CHAT_HISTORY_MESSAGES);
      let response: Response;
      try {
        response=await fetch(`${baseUrl}/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:conversation}),signal});
      } catch (error) {
        if (isAbort(error)) throw new ServiceError('cancelled', 'Request cancelled.');
        throw new ServiceError('unavailable', 'The portfolio backend is unavailable.');
      }
      const payload=await readApiPayload(response);
      if (!response.ok) throw new ServiceError('unavailable', apiErrorMessage(payload,response.status));
      return validateChatReply(payload);
    },
  };
  return {
    async send(message, history, signal) {
      try { return await remote.send(message, history, signal); }
      catch (error) {
        if (error instanceof ServiceError && error.code === 'unavailable') return fallback.send(message, history, signal);
        throw error;
      }
    },
  };
}

/** Replaceable persistence boundary; malformed/private-mode storage fails closed. */
export class BrowserHistoryStore implements HistoryStore {
  private readonly maxMessages: number;

  constructor(
    private readonly key = 'portfolio.conversation.v1',
    maxMessages = MAX_CHAT_HISTORY_MESSAGES,
  ) {
    this.maxMessages = Math.min(Math.max(1, maxMessages), MAX_CHAT_HISTORY_MESSAGES);
  }

  load(): ChatMessage[] {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(this.key) ?? '[]');
      if (!Array.isArray(value)) return [];
      return value
        .filter(isStoredChatMessage)
        .slice(-this.maxMessages)
        .map(({ role, content }) => ({ role, content: content.trim() }));
    } catch { return []; }
  }

  save(messages: readonly ChatMessage[]): void {
    try {
      localStorage.setItem(
        this.key,
        JSON.stringify(
          messages
            .filter(isStoredChatMessage)
            .slice(-this.maxMessages)
            .map(({ role, content }) => ({ role, content: content.trim() })),
        ),
      );
    } catch { /* Browser storage is optional. */ }
  }
  clear(): void {
    try { localStorage.removeItem(this.key); } catch { /* Browser storage is optional. */ }
  }
}
