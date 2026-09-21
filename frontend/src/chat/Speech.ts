export interface SpeechConfig {
  /** Durations are seconds; playbackRate is a sample speed/pitch multiplier. */
  characterDelay: number;
  spaceDelay: number;
  commaDelay: number;
  periodDelay: number;
  lineBreakDelay: number;
  holdDuration: number;
  volume: number;
  sampleDuration: number;
  sampleOffset: number;
  playbackRate: number;
  playbackRateVariance: number;
  minSoundInterval: number;
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
  private sample: AudioBuffer | null = null;
  private sampleLoading: Promise<void> | null = null;
  private source: AudioBufferSourceNode | null = null;
  private lastSound = -Infinity;
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
      pronounce = /[\p{L}\p{N}]/u.test(character);
      if (!pronounce) this.stopSound();
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
      if (!this.sampleLoading) {
        const context = this.context;
        this.sampleLoading = fetch(new URL('../../assets/sound_effects/sans_voice.mp3', import.meta.url))
          .then(response => { if (!response.ok) throw new Error('Voice sample unavailable'); return response.arrayBuffer(); })
          .then(bytes => context.decodeAudioData(bytes))
          .then(buffer => { if (!this.disposed) this.sample = buffer; })
          .catch(() => { /* Dialogue still works if the optional audio cannot load. */ });
      }
    } catch { /* Continue silently if audio is unsupported. */ }
  }
  private stopSound(): void {
    this.source?.stop();
    this.source = null;
  }
  private playTone(): void {
    if (!this.context || !this.sample || this.context.state !== 'running') return;
    const start = this.context.currentTime;
    if (start - this.lastSound < this.config.minSoundInterval) return;
    this.stopSound();
    const source = this.source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = this.sample;
    source.playbackRate.value = this.config.playbackRate + (Math.random() * 2 - 1) * this.config.playbackRateVariance;
    gain.gain.setValueAtTime(this.config.volume, start);
    gain.gain.linearRampToValueAtTime(0, start + this.config.sampleDuration);
    source.connect(gain);
    gain.connect(this.context.destination);
    source.start(start, this.config.sampleOffset);
    source.stop(start + this.config.sampleDuration);
    this.lastSound = start;
    source.onended = () => { source.disconnect(); gain.disconnect(); if (this.source === source) this.source = null; };
  }
  dispose(): void {
    this.disposed = true;
    this.queue = [];
    this.stopSound();
    if (this.context) void this.context.close().catch(() => undefined);
    this.context = null;
  }
}
