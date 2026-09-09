export interface SpeechConfig {
  /** All durations are seconds; pitch is in Hz. */
  characterDelay: number;
  spaceDelay: number;
  commaDelay: number;
  periodDelay: number;
  lineBreakDelay: number;
  holdDuration: number;
  volume: number;
  pitch: number;
  pitchVariance: number;
  toneDuration: number;
}
export type SpeechState = 'idle' | 'received' | 'displaying' | 'finished';
export interface SpeechSnapshot {
  state: SpeechState;
  text: string;
  fullText: string;
  sequence: number;
}

/** Call tick(frameDeltaSeconds) from the render loop. Received, display completion,
 * and final hold are separate states; enqueue never interrupts the current line. */
export class SpeechQueue {
  private queue: string[] = [];
  private characters: string[] = [];
  private cursor = 0;
  private elapsed = 0;
  private delay = 0;
  private context: AudioContext | null = null;
  private muted = false;
  private disposed = false;
  private current: SpeechSnapshot = { state: 'idle', text: '', fullText: '', sequence: 0 };
  constructor(private readonly config: SpeechConfig, private readonly onUpdate: (snapshot: SpeechSnapshot) => void) {}
  get snapshot(): Readonly<SpeechSnapshot> { return this.current; }
  enqueue(message: string): void {
    if (this.disposed) return;
    this.queue.push(message);
    if (this.current.state === 'idle') this.startNext();
  }
  private emit(): void { this.onUpdate({ ...this.current }); }
  private startNext(): void {
    const message = this.queue.shift();
    this.elapsed = 0;
    this.delay = 0;
    this.cursor = 0;
    if (message === undefined) {
      this.current = { ...this.current, state: 'idle', text: '', fullText: '' };
    } else {
      this.characters = Array.from(message);
      this.current = { state: 'received', text: '', fullText: message, sequence: this.current.sequence + 1 };
    }
    this.emit();
  }
  tick(deltaSeconds: number): void {
    if (this.disposed || this.current.state === 'idle') return;
    if (this.current.state === 'received') {
      this.current = { ...this.current, state: 'displaying' };
      this.emit();
    }
    this.elapsed += Math.max(0, deltaSeconds);
    if (this.current.state === 'finished') {
      if (this.elapsed >= this.config.holdDuration) this.startNext();
      return;
    }
    const previousText = this.current.text;
    let pronounce = false;
    while (this.elapsed >= this.delay && this.cursor < this.characters.length) {
      this.elapsed -= this.delay;
      const character = this.characters[this.cursor++]!;
      this.current = { ...this.current, text: this.current.text + character };
      this.delay = this.characterDelay(character);
      if (/[\p{L}\p{N}]/u.test(character)) pronounce = true;
    }
    if (pronounce) this.playTone();
    if (this.cursor === this.characters.length && this.elapsed >= this.delay) {
      this.current = { ...this.current, state: 'finished' };
      this.elapsed = 0;
    }
    if (this.current.text !== previousText || this.current.state === 'finished') this.emit();
  }
  private characterDelay(character: string): number {
    if (character === '\n') return this.config.lineBreakDelay;
    if (/\s/u.test(character)) return this.config.spaceDelay;
    if (/[,;:]/u.test(character)) return this.config.commaDelay;
    if (/[.!?…]/u.test(character)) return this.config.periodDelay;
    return this.config.characterDelay;
  }
  /** Invoke directly in a pointer/key handler to respect browser audio policy. */
  unlockAudio(): void {
    if (this.disposed) return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => undefined);
    } catch { /* Continue silently if audio is unsupported. */ }
  }
  setMuted(muted: boolean): void { this.muted = muted; }
  private playTone(): void {
    if (this.muted || !this.context || this.context.state !== 'running') return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const start = this.context.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.value = Math.max(1, this.config.pitch + (Math.random() * 2 - 1) * this.config.pitchVariance);
    gain.gain.setValueAtTime(this.config.volume, start);
    gain.gain.linearRampToValueAtTime(0, start + this.config.toneDuration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + this.config.toneDuration);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  dispose(): void {
    this.disposed = true;
    this.queue = [];
    if (this.context) void this.context.close().catch(() => undefined);
    this.context = null;
  }
}
