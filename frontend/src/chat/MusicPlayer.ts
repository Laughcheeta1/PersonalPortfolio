import { config } from '../config';

/** User-selected soundtrack, independent of ambient sound and speech effects. */
export class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private active = false;
  private disposed = false;
  get enabled(): boolean { return this.active; }
  unlock(): void {
    if (this.disposed || this.audio) return;
    this.audio = new Audio(new URL('../../assets/music/the_smoke_decides.mp3', import.meta.url).href);
    this.audio.loop = true;
    this.audio.preload = 'none';
    this.audio.volume = config.audio.musicVolume;
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
