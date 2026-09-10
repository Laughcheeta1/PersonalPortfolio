import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createBackendChatService,
  createBackendPanelContentService,
  ServiceError,
  validatePanelDefinition,
} from './services';

afterEach(() => vi.unstubAllGlobals());

describe('backend service adapters', () => {
  it('loads sanitized-compatible panel definitions from the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ type: 'html', html: '<h2>Projects</h2>', localize: false }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const panel = await createBackendPanelContentService('http://backend/api').get('starship:front');

    expect(panel).toEqual({ type: 'html', html: '<h2>Projects</h2>', localize: false });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://backend/api/panels/starship%3Afront',
      { signal: undefined },
    );
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

    await expect(
      createBackendPanelContentService('http://backend/api').get('starship:front'),
    ).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('rejects malformed panel responses', () => {
    expect(() => validatePanelDefinition({ type: 'html', html: 42 })).toThrow(ServiceError);
    expect(validatePanelDefinition({ type: 'none' })).toEqual({ type: 'none', localize: false });
  });
});
