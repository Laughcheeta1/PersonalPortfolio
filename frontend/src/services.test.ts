import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createBackendChatService,
  createPanelContentService,
  MAX_CHAT_HISTORY_MESSAGES,
  MAX_CHAT_MESSAGE_LENGTH,
  ServiceError,
  validateChatMessage,
  validatePanelDefinition,
} from './services';

afterEach(() => vi.unstubAllGlobals());

describe('backend service adapters', () => {
  it('loads standalone panel documents from the local registry', async () => {
    const panel = await createPanelContentService().get('starship:front');

    expect(panel).toEqual({
      type: 'iframe',
      url: 'http://127.0.0.1:8000/api/panels/starship%3Afront',
      title: 'Projects front notebook',
      localize: false,
    });
  });

  it('sends the complete browser conversation and validates chat replies', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Let us visit projects.', destination_object_id: 'starship' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const history = [
      { role: 'user' as const, content: 'Show me projects' },
      { role: 'assistant' as const, content: 'Gladly.' },
    ];

    const reply = await createBackendChatService('http://backend/api').send('Show me projects', history);

    expect(reply.destination_object_id).toBe('starship');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://backend/api/chat',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: 'Show me projects' }],
        }),
      }),
    );
  });

  it('maps network failures to the existing unavailable service error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const reply = await createBackendChatService('http://backend/api').send('Take me to starship', []);

    expect(reply.destination_object_id).toBe('starship');
  });

  it('bounds messages and the outgoing browser history', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Sure.', destination_object_id: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const history = Array.from({ length: MAX_CHAT_HISTORY_MESSAGES + 2 }, (_, index) => ({
      role: 'assistant' as const,
      content: `Earlier ${index}`,
    }));
    await createBackendChatService('http://backend/api').send('Hello', history);

    const payload = JSON.parse(fetchMock.mock.calls[0]![1].body as string) as {
      messages: Array<{ content: string }>;
    };
    expect(payload.messages).toHaveLength(MAX_CHAT_HISTORY_MESSAGES);
    expect(payload.messages.at(-1)?.content).toBe('Hello');
    expect(() => validateChatMessage('x'.repeat(MAX_CHAT_MESSAGE_LENGTH + 1))).toThrow(ServiceError);
  });

  it('rejects malformed panel responses', () => {
    expect(() => validatePanelDefinition({ type: 'html', html: 42 })).toThrow(ServiceError);
    expect(validatePanelDefinition({
      type: 'iframe',
      url: 'http://backend/api/panels/starship%3Afront',
      title: 'Projects front notebook',
      localize: false,
    })).toEqual({
      type: 'iframe',
      url: 'http://backend/api/panels/starship%3Afront',
      title: 'Projects front notebook',
      localize: false,
    });
    expect(validatePanelDefinition({ type: 'none' })).toEqual({ type: 'none', localize: false });
  });
});
