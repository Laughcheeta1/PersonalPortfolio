import { config } from '../config';

/** User-selected soundtrack, independent of ambient sound and speech effects. */
export class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private active = false;
  private disposed = false;
  private volume: number = config.audio.musicVolume;
  get enabled(): boolean { return this.active; }
  get currentVolume(): number { return this.volume; }
  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) return;
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.audio) this.audio.volume = this.volume;
  }
  unlock(): void {
    if (this.disposed || this.audio) return;
    this.audio = new Audio(new URL('../../assets/music/party_bathroom_audio.mp3', import.meta.url).href);
    this.audio.loop = true;
    this.audio.preload = 'none';
    this.audio.volume = this.volume;
  }
  async setEnabled(enabled: boolean): Promise<void> {
    if (this.disposed) return;
    if (!enabled) {
      this.active = false;
      this.audio?.pause();
      return;
    }
    this.unlock();
    this.active = true;
    try { await this.audio!.play(); }
    catch (error) { this.active = false; throw error; }
  }
  dispose(): void {
    this.disposed = true;
    this.active = false;
    this.audio?.pause();
    if (this.audio) { this.audio.removeAttribute('src'); this.audio.load(); }
    this.audio = null;
  }
}
