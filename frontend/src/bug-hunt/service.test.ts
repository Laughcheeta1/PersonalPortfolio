import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalHuntSession, HuntServiceError, huntService, isHuntServiceUnavailable } from './service';

afterEach(() => { vi.unstubAllGlobals(); });

describe('bug hunt score service', () => {
  it('classifies network failures as an unavailable score service', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(huntService.start({ player_id: crypto.randomUUID(), display_name: 'Offline Hunter' }))
      .rejects.toMatchObject({ status: 0, message: 'The score service is unavailable.' });
  });

  it('only treats score-service failures as locally playable', () => {
    expect(isHuntServiceUnavailable(new HuntServiceError(503, 'Unavailable'))).toBe(true);
    expect(isHuntServiceUnavailable(new HuntServiceError(409, 'Round active'))).toBe(false);
    expect(isHuntServiceUnavailable(new Error('Invalid response'))).toBe(false);
  });

  it('creates a timed local session without a score token', () => {
    const session = createLocalHuntSession();

    expect(session).toMatchObject({ duration_seconds: 45, session_token: '', local: true });
    expect(session.session_id).toMatch(/^local-/);
  });
});
