import { config } from '../config';

/** User-selected soundtrack, independent of ambient sound and speech effects. */
export class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private frequencyData: Uint8Array<ArrayBuffer> | null = null;
  private averageEnergy = 0;
  private beatCooldown = 0;
  private active = false;
  private disposed = false;
  private volume: number = config.audio.musicVolume;
  get enabled(): boolean { return this.active; }
  get currentVolume(): number { return this.volume; }
  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) return;
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.audio) this.audio.volume = this.volume;
    if (this.volume === 0) this.resetBeatDetection();
  }
  unlock(): void {
    if (this.disposed) return;
    if (this.audio) {
      if (this.audioContext) void this.audioContext.resume().catch(() => undefined);
      return;
    }
    this.audio = new Audio(new URL('../../assets/music/party_bathroom_audio.mp3', import.meta.url).href);
    this.audio.loop = true;
    this.audio.preload = 'none';
    this.audio.volume = this.volume;
    this.setupAnalyser();
  }
  async setEnabled(enabled: boolean): Promise<void> {
    if (this.disposed) return;
    if (!enabled) {
      this.active = false;
      this.audio?.pause();
      this.resetBeatDetection();
      return;
    }
    this.unlock();
    if (this.audioContext) await this.audioContext.resume().catch(() => undefined);
    this.active = true;
    try { await this.audio!.play(); }
    catch (error) { this.active = false; throw error; }
  }
  /** Returns true when a new low-frequency onset is detected in the soundtrack. */
  update(deltaSeconds: number): boolean {
    this.beatCooldown = Math.max(0, this.beatCooldown - Math.max(0, deltaSeconds));
    if (!this.active || this.volume <= 0 || !this.analyser || !this.frequencyData) {
      this.averageEnergy = 0;
      return false;
    }
    this.analyser.getByteFrequencyData(this.frequencyData);
    const binCount = Math.min(config.audio.beatFrequencyBins, this.frequencyData.length - 1);
    let energy = 0;
    for (let bin = 1; bin <= binCount; bin++) energy += this.frequencyData[bin]! / 255;
    energy /= Math.max(1, binCount);
    const previousAverage = this.averageEnergy;
    this.averageEnergy += (energy - previousAverage) * config.audio.beatAverageSmoothing;
    if (this.beatCooldown > 0) return false;
    const threshold = Math.max(config.audio.beatMinimumEnergy, previousAverage * config.audio.beatThreshold);
    if (energy <= threshold) return false;
    this.beatCooldown = config.audio.beatCooldown;
    return true;
  }
  private setupAnalyser(): void {
    if (!this.audio || typeof AudioContext === 'undefined') return;
    let context: AudioContext | null = null;
    try {
      context = new AudioContext();
      const source = context.createMediaElementSource(this.audio), analyser = context.createAnalyser();
      analyser.fftSize = config.audio.beatFftSize;
      analyser.smoothingTimeConstant = .05;
      source.connect(analyser);analyser.connect(context.destination);
      this.audioContext = context;this.mediaSource = source;this.analyser = analyser;this.frequencyData = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      if (context) void context.close().catch(() => undefined);
    }
  }
  private resetBeatDetection(): void { this.averageEnergy = 0; this.beatCooldown = 0; }
  dispose(): void {
    this.disposed = true;
    this.active = false;
    this.audio?.pause();
    this.analyser?.disconnect();this.mediaSource?.disconnect();
    if (this.audioContext) void this.audioContext.close().catch(() => undefined);
    if (this.audio) { this.audio.removeAttribute('src'); this.audio.load(); }
    this.audio = null;this.audioContext = null;this.mediaSource = null;this.analyser = null;this.frequencyData = null;
  }
}
