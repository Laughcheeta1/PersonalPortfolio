import { config } from './config';
export class Input {
  keys = new Set<string>();
  joystick = { x: 0, z: 0 };
  yaw = 0;
  pitch: number = config.camera.pitch;
  private abort = new AbortController();
  constructor(surface: HTMLElement, stick: HTMLElement, unlock: () => void) {
    const options = { signal: this.abort.signal };
    window.addEventListener('keydown', event => {
      unlock();
      if (this.editing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) { this.keys.add(event.code); event.preventDefault(); }
    }, options);
    window.addEventListener('keyup', event => this.keys.delete(event.code), options);
    window.addEventListener('blur', () => this.clear(), options);
    document.addEventListener('visibilitychange', () => this.clear(), options);
    document.addEventListener('focusin', () => this.keys.clear(), options);
    let drag: { id: number; x: number; y: number } | null = null;
    surface.addEventListener('pointerdown', event => {
      if (event.button !== 0 || drag) return;
      (document.activeElement as HTMLElement)?.blur(); unlock();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY }; surface.setPointerCapture(event.pointerId);
    }, options);
    surface.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const sensitivity = event.pointerType === 'touch' ? config.camera.touchSensitivity : config.camera.mouseSensitivity;
      this.yaw -= (event.clientX - drag.x) * sensitivity;
      this.pitch = Math.max(config.camera.minPitch, Math.min(config.camera.maxPitch, this.pitch + (event.clientY - drag.y) * sensitivity));
      drag.x = event.clientX; drag.y = event.clientY;
    }, options);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) surface.addEventListener(type, () => { drag = null; }, options);
    let stickId: number | null = null;
    const move = (event: PointerEvent) => {
      const box = stick.getBoundingClientRect(), x = event.clientX - box.left - box.width / 2, y = event.clientY - box.top - box.height / 2;
      const length = Math.max(config.input.joystickRadius, Math.hypot(x, y));
      this.joystick = { x: x / length, z: y / length };
      (stick.firstElementChild as HTMLElement).style.transform = `translate(${this.joystick.x * config.input.joystickRadius}px, ${this.joystick.z * config.input.joystickRadius}px)`;
    };
    stick.addEventListener('pointerdown', event => { unlock(); stickId = event.pointerId; stick.setPointerCapture(event.pointerId); move(event); }, options);
    stick.addEventListener('pointermove', event => { if (event.pointerId === stickId) move(event); }, options);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) stick.addEventListener(type, () => { stickId = null; this.joystick = { x: 0, z: 0 }; (stick.firstElementChild as HTMLElement).style.transform = ''; }, options);
  }
  get editing() { return !!document.activeElement?.closest('input,textarea,select,[contenteditable="true"]'); }
  get movement() {
    if (this.editing) return { x: 0, z: 0 };
    return { x: Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')) + this.joystick.x, z: Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) - Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) + this.joystick.z };
  }
  clear() { this.keys.clear(); this.joystick = { x: 0, z: 0 }; }
  dispose() { this.abort.abort(); }
}
