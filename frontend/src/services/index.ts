import DOMPurify from 'dompurify';
import { landmarks, type LandmarkId } from '../world/registry';
import { t } from '../i18n';
import { panelContent } from '../content/panels';

export type PanelDefinition = (
  | { type: 'html'; html: string }
  | { type: 'iframe'; url: string; title: string }
  | { type: 'none' }
) & { localize?: boolean };
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

const apiBaseUrl = ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api').replace(/\/+$/, '');

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

export function validatePanelDefinition(value: unknown): PanelDefinition {
  if (!value || typeof value !== 'object') throw new ServiceError('invalid-response', 'The notebook returned an invalid panel.');
  const panel = value as Record<string, unknown>;
  if (panel.type === 'none') return { type: 'none', localize: false };
  if (panel.type === 'html' && typeof panel.html === 'string') return { type: 'html', html: panel.html, localize: panel.localize === true };
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
  const local: PanelContentService = {
    async get(panelId, signal) {
      checkSignal(signal);
      const landmark = landmarks.find(item => item.frontPanel === panelId || item.backPanel === panelId);
      if (!landmark) return { type: 'none' };
      if (landmark.model === 'library') return { type: 'html', html: '<p>Empire construction in progress, you will know it in the news</p>', localize: false };
      const back = landmark.backPanel === panelId;
      const override = panelContent[landmark.model]?.[back ? 'back' : 'front'];
      if (override) return { ...override, localize: false };
      const html = back
        ? `<p class="eyebrow">THE OTHER SIDE</p><h2>A little secret</h2><p>You walked around ${landmark.title}. Curiosity looks good on you.</p><p>This corner is reserved for future stories, hidden notes, and the occasional terrible joke.</p>`
        : `<p class="eyebrow">ISLAND NOTEBOOK</p><h2>${landmark.title}</h2><p>${landmark.subtitle}</p><p>This is a place for a personal story. Projects, photographs, reflections, and links will live here as the portfolio grows.</p><details><summary>About this space</summary><p>The island is a work in progress. This sample content is supplied by the local panel service and can later be managed independently of the world.</p></details><label>A note to yourself<input placeholder="Try typing here…" aria-label="A note to yourself" /></label><p class="panel-footnote">Your note stays in this panel for this visit.</p>`;
      return { type: 'html', html: sanitizePanelHtml(html) };
    },
  };
  const remote = createBackendPanelContentService();
  return {
    async get(panelId, signal) {
      try { return await remote.get(panelId, signal); }
      catch (error) {
        if (error instanceof ServiceError && error.code === 'unavailable') return local.get(panelId, signal);
        throw error;
      }
    },
  };
}

export function createBackendPanelContentService(baseUrl = apiBaseUrl): PanelContentService {
  return {
    async get(panelId, signal) {
      checkSignal(signal);
      let response: Response;
      try { response=await fetch(`${baseUrl}/panels/${encodeURIComponent(panelId)}`,{signal}); }
      catch (error) {
        if (isAbort(error)) throw new ServiceError('cancelled', 'Request cancelled.');
        throw new ServiceError('unavailable', 'The portfolio backend is unavailable.');
      }
      const payload=await readApiPayload(response);
      if (!response.ok) throw new ServiceError('unavailable', apiErrorMessage(payload,response.status));
      return validatePanelDefinition(payload);
    },
  };
}

export function createChatService(): ChatService {
  return {
    async send(message, _history, signal) {
      checkSignal(signal);
      const normalized = message.toLocaleLowerCase().trim();
      const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
      const matches = (term: string) => term.includes('-') ? normalized.includes(term) : tokens.includes(term);
      const destination = landmarks.find(item => matches(item.id) || matches(item.model) || [item.title,t(item.title)].some(title=>title.toLocaleLowerCase().split(/\W+/).some(word => word.length > 3 && tokens.includes(word))));
      return validateChatReply(destination
        ? { message: t("Let's head to {title}. Follow me along the paths! {subtitle} Take a look behind the landmark, too—there is another side to every story.",{title:t(destination.title),subtitle:t(destination.subtitle)}), destination_object_id: destination.id }
        : { message: t("Welcome to my little island! I'm a local demo guide for now. Ask me to take you to {places}. You can also wander at your own pace and discover the stories at each landmark.",{places:landmarks.map(item => t(item.title)).join(', ')}), destination_object_id: null });
    },
  };
}

export function createBackendChatService(baseUrl = apiBaseUrl, fallback: ChatService = createChatService()): ChatService {
  const remote: ChatService = {
    async send(message, history, signal) {
      checkSignal(signal);
      const conversation = history.length && history.at(-1)?.role === 'user' && history.at(-1)?.content === message
        ? history
        : [...history, { role: 'user' as const, content: message }];
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
