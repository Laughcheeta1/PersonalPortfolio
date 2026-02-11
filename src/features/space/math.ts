const TWO_PI = Math.PI * 2;

export function wrapToPi(angle: number): number {
  const wrapped = (angle + Math.PI) % TWO_PI;
  return wrapped < 0 ? wrapped + Math.PI : wrapped - Math.PI;
}

export function damp(current: number, target: number, strength: number): number {
  return current + (target - current) * strength;
}
