import { config } from '../config';

/** User-selected soundtrack, independent of ambient sound and subject to global mute. */
export class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private muted = true;
  private active = false;
  private disposed = false;
  get enabled(): boolean { return this.active; }
  unlock(): void {
    if (this.disposed || this.audio) return;
    this.audio = new Audio(new URL('../../assets/music/the_smoke_decides.mp3', import.meta.url).href);
    this.audio.loop = true;
    this.audio.preload = 'none';
    this.audio.volume = config.audio.musicVolume;
    this.audio.muted = this.muted;
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
  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.audio) this.audio.muted = muted;
  }
  dispose(): void {
    this.disposed = true;
    this.active = false;
    this.audio?.pause();
    if (this.audio) { this.audio.removeAttribute('src'); this.audio.load(); }
    this.audio = null;
  }
}
