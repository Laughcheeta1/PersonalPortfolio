import { config } from '../config';
import { biomeWeights } from '../world/atmosphere';
import { ambientSynthesis, type AmbientProfile } from './audioConfig';

interface Layer { source: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode }
/** Original synthesized surf plus seven distinct, smoothly mixed biome soundscapes. */
export class AmbientAudio {
  private context: AudioContext | null = null;
  private layers = new Map<string, Layer>();
  private disposed = false;
  unlock(): void {
    if (this.disposed) return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.layers.set('surf', this.createLayer());
        for (const [biome, profile] of Object.entries(ambientSynthesis.profiles)) {
          this.layers.set(biome, this.createLayer(profile));
        }
      }
      void this.context.resume().catch(() => undefined);
    } catch { /* Audio is optional when unavailable. */ }
  }
  private createLayer(profile?: AmbientProfile): Layer {
    const context = this.context!;
    const buffer = context.createBuffer(1, context.sampleRate * config.audio.bufferSeconds, context.sampleRate);
    const data = buffer.getChannelData(0);
    let noise = 0;
    for (let i = 0; i < data.length; i++) {
      noise = (noise + (Math.random() - .5) * ambientSynthesis.noiseInput) / ambientSynthesis.noiseMemory;
      const t = i / context.sampleRate;
      const pulse = profile ? 1 - profile.modulation * (.5 + .5 * Math.cos(Math.PI * 2 * profile.pulse * t)) : 1;
      data[i] = profile
        ? (noise * ambientSynthesis.noiseGain * profile.noise + Math.sin(Math.PI * 2 * profile.frequency * t) * profile.tone) * pulse
        : noise * ambientSynthesis.noiseGain;
    }
    // Match the loop endpoints without introducing a click every buffer cycle.
    const difference = data[data.length - 1]! - data[0]!;
    for (let i = 0; i < data.length; i++) data[i] = data[i]! - difference * i / (data.length - 1);
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = profile?.filter ?? config.audio.baseFilter;
    gain.gain.value = 0;
    source.connect(filter); filter.connect(gain); gain.connect(context.destination);
    source.start();
    return { source, filter, gain };
  }
  update(position: { x: number; z: number }): void {
    if (!this.context) return;
    const { weights } = biomeWeights(position);
    const lunar = weights.find(b => b.landmark.biome === 'lunar')?.weight ?? 0;
    const altitude = weights.find(b => b.landmark.biome === 'altitude')?.weight ?? 0;
    const now = this.context.currentTime;
    for (const [name, layer] of this.layers) {
      const weight = name === 'surf' ? 1 - lunar * ambientSynthesis.lunarSurfAttenuation : weights.find(b => b.landmark.biome === name)?.weight ?? 0;
      const volume = name === 'surf' ? config.audio.ambientVolume : config.audio.biomeVolume;
      layer.gain.gain.setTargetAtTime(volume * weight, now, config.audio.blendTime);
    }
    this.layers.get('surf')?.filter.frequency.setTargetAtTime(
      config.audio.baseFilter + (config.audio.altitudeFilter - config.audio.baseFilter) * altitude + (config.audio.lunarFilter - config.audio.baseFilter) * lunar,
      now, config.audio.blendTime,
    );
  }
  dispose(): void {
    this.disposed = true;
    for (const layer of this.layers.values()) { layer.source.stop(); layer.source.disconnect(); layer.filter.disconnect(); layer.gain.disconnect(); }
    this.layers.clear();
    void this.context?.close().catch(() => undefined);
    this.context = null;
  }
}
