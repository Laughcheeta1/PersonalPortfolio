import { afterEach, describe, expect, it, vi } from 'vitest';
import { config } from '../config';
import { MusicPlayer } from './MusicPlayer';
import { SpeechQueue } from './Speech';
import { AmbientAudio } from './AmbientAudio';
import { landmarks } from '../world/registry';

afterEach(() => vi.unstubAllGlobals());

function audioHarness() {
  const sources: Array<{ stop: ReturnType<typeof vi.fn> }> = [];
  const gains: Array<{ gain: { value: number; setValueAtTime: ReturnType<typeof vi.fn>; setTargetAtTime: ReturnType<typeof vi.fn>; linearRampToValueAtTime: ReturnType<typeof vi.fn>; cancelScheduledValues: ReturnType<typeof vi.fn> } }> = [];
  const parameter = () => ({ value: 0, setValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() });
  const context = {
    currentTime: 0, state: 'running', sampleRate: 100, destination: {}, resume: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined),
    decodeAudioData: vi.fn().mockResolvedValue({}),
    createBuffer: vi.fn((_channels: number, length: number) => ({ getChannelData: () => new Float32Array(length) })),
    createBufferSource: vi.fn(() => { const source = { connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), playbackRate: { value: 1 } }; sources.push(source); return source; }),
    createGain: vi.fn(() => { const gain = { gain: parameter(), connect: vi.fn(), disconnect: vi.fn() }; gains.push(gain); return gain; }),
    createBiquadFilter: vi.fn(() => ({ frequency: parameter(), connect: vi.fn(), disconnect: vi.fn() })),
  };
  vi.stubGlobal('AudioContext', vi.fn(function () { return context; }));
  return { context, sources, gains };
}

describe('sampled speech audio', () => {
  it('loads the supplied clip once and stops a playing syllable on spaces', async () => {
    const { context, sources } = audioHarness();
    const fetcher = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
    vi.stubGlobal('fetch', fetcher);
    const speech = new SpeechQueue(config.speech, () => {});
    speech.unlockAudio(); speech.unlockAudio();
    await vi.waitFor(() => expect(context.decodeAudioData).toHaveBeenCalledOnce());
    speech.enqueue('A B'); speech.tick(0);
    expect(sources).toHaveLength(1);
    expect(context.createBufferSource.mock.results[0]!.value.start).toHaveBeenCalledWith(0, config.speech.sampleOffset);
    speech.tick(config.speech.characterDelay);
    expect(sources[0]!.stop).toHaveBeenCalledTimes(2); // Scheduled stop plus punctuation cancellation.
    context.currentTime = 1;
    speech.tick(config.speech.spaceDelay);
    expect(sources).toHaveLength(2);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(String(fetcher.mock.calls[0]![0])).toContain('sans_voice.mp3');
    speech.dispose();
  });
});

describe('ambient biome audio', () => {
  it('mixes an always-on layer for every biome and changes with proximity', () => {
    const { gains, sources } = audioHarness();
    const ambient = new AmbientAudio(); ambient.unlock();
    expect(sources).toHaveLength(landmarks.length + 1);
    for (const landmark of landmarks) {
      ambient.update({ x: landmark.position[0], z: landmark.position[1] });
      const layer = gains[landmarks.indexOf(landmark) + 1]!;
      expect(layer.gain.setTargetAtTime.mock.lastCall![0]).toBeGreaterThan(0);
    }
    ambient.dispose();
    for (const source of sources) expect(source.stop).toHaveBeenCalledOnce();
  });
});

describe('optional music', () => {
  it('does not autoplay, stays audible, and reports playback failure', async () => {
    const audio = { loop: false, preload: '', muted: false, volume: 0, play: vi.fn().mockResolvedValue(undefined), pause: vi.fn(), removeAttribute: vi.fn(), load: vi.fn() };
    vi.stubGlobal('Audio', vi.fn(function () { return audio; }));
    const music = new MusicPlayer(); music.unlock();
    expect(audio.play).not.toHaveBeenCalled();
    expect(music.enabled).toBe(false);
    await music.setEnabled(true);
    expect(audio.loop).toBe(true); expect(audio.muted).toBe(false); expect(music.enabled).toBe(true);
    await music.setEnabled(false); expect(audio.pause).toHaveBeenCalledOnce();
    audio.play.mockRejectedValueOnce(new Error('Playback unavailable'));
    await expect(music.setEnabled(true)).rejects.toThrow('Playback unavailable');
    expect(music.enabled).toBe(false);
    music.dispose();
  });
});
