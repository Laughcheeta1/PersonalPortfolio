import DOMPurify from 'dompurify';
import { landmarks, type LandmarkId } from '../world/registry';

export type PanelDefinition =
  | { type: 'html'; html: string }
  | { type: 'iframe'; url: string; title: string }
  | { type: 'none' };
export type ServiceErrorCode = 'unavailable' | 'invalid-response' | 'cancelled';
export class ServiceError extends Error {
  constructor(public readonly code: ServiceErrorCode, message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}
export interface ChatReply { message: string; destination_object_id: LandmarkId | null }
export interface ChatMessage { role: 'user' | 'assistant'; content: string }
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

export function validateChatReply(value: unknown): ChatReply {
  if (!value || typeof value !== 'object') throw new ServiceError('invalid-response', 'The guide received an invalid reply.');
  const reply = value as Record<string, unknown>;
  if (typeof reply.message !== 'string' || !(reply.destination_object_id === null || landmarks.some(item => item.id === reply.destination_object_id))) {
    throw new ServiceError('invalid-response', 'The guide received an unknown destination or invalid message.');
  }
  return { message: reply.message, destination_object_id: reply.destination_object_id as LandmarkId | null };
}

/** Keep sanitization at the trust boundary when replacing mocks with HTTP content. */
export function sanitizePanelHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['iframe', 'style', 'script'],
    FORBID_ATTR: ['style'],
  });
}

function checkSignal(signal?: AbortSignal): void {
  if (signal?.aborted) throw new ServiceError('cancelled', 'Request cancelled.');
}

export function createPanelContentService(): PanelContentService {
  return {
    async get(panelId, signal) {
      checkSignal(signal);
      const landmark = landmarks.find(item => item.frontPanel === panelId || item.backPanel === panelId);
      if (!landmark) return { type: 'none' };
      const back = landmark.backPanel === panelId;
      const html = back
        ? `<p class="eyebrow">THE OTHER SIDE</p><h2>A little secret</h2><p>You walked around ${landmark.title}. Curiosity looks good on you.</p><p>This corner is reserved for future stories, hidden notes, and the occasional terrible joke.</p>`
        : `<p class="eyebrow">ISLAND NOTEBOOK</p><h2>${landmark.title}</h2><p>${landmark.subtitle}</p><p>This is a place for a personal story. Projects, photographs, reflections, and links will live here as the portfolio grows.</p><details><summary>About this space</summary><p>The island is a work in progress. This sample content is supplied by the local panel service and can later be managed independently of the world.</p></details><label>A note to yourself<input placeholder="Try typing here…" aria-label="A note to yourself" /></label><p class="panel-footnote">Your note stays in this panel for this visit.</p>`;
      return { type: 'html', html: sanitizePanelHtml(html) };
    },
  };
}

export function createChatService(): ChatService {
  return {
    async send(message, _history, signal) {
      checkSignal(signal);
      const normalized = message.toLocaleLowerCase().trim();
      const destination = landmarks.find(item => normalized.includes(item.id) || normalized.includes(item.model) || normalized.includes(item.title.toLocaleLowerCase()) || item.title.toLocaleLowerCase().split(/\s+/).some(word => word.length > 3 && normalized.includes(word)));
      return validateChatReply(destination
        ? { message: `Let's head to ${destination.title}. Follow me along the paths! ${destination.subtitle} Take a look behind the landmark, too—there is another side to every story.`, destination_object_id: destination.id }
        : { message: `Welcome to my little island! I'm a local demo guide for now. Ask me to take you to ${landmarks.map(item => item.title).join(', ')}. You can also wander at your own pace and discover the stories at each landmark.`, destination_object_id: null });
    },
  };
}

/** Replaceable persistence boundary; malformed/private-mode storage fails closed. */
export class BrowserHistoryStore implements HistoryStore {
  constructor(private readonly key = 'portfolio.conversation.v1', private readonly maxMessages = 100) {}
  load(): ChatMessage[] {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(this.key) ?? '[]');
      if (!Array.isArray(value)) return [];
      return value.filter((item): item is ChatMessage => !!item && typeof item === 'object' && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string').slice(-this.maxMessages).map(({ role, content }) => ({ role, content }));
    } catch { return []; }
  }
  save(messages: readonly ChatMessage[]): void {
    try { localStorage.setItem(this.key, JSON.stringify(messages.slice(-this.maxMessages))); } catch { /* Browser storage is optional. */ }
  }
  clear(): void {
    try { localStorage.removeItem(this.key); } catch { /* Browser storage is optional. */ }
  }
}
