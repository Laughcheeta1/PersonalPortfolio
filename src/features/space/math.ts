const TWO_PI = Math.PI * 2;

// Wrap any angle into [-PI, PI].
// Why: when comparing two angles, this gives the shortest signed difference.
// Example: 359deg and 1deg are actually very close; wrapping avoids "big jump" math.
export function wrapToPi(angle: number): number {
  const wrapped = (angle + Math.PI) % TWO_PI;
  return wrapped < 0 ? wrapped + Math.PI : wrapped - Math.PI;
}

// Simple damping / interpolation helper.
// Moves "current" toward "target" by a fraction ("strength") each frame.
// strength=0   -> no movement
// strength=1   -> instant snap
// in-between   -> smooth motion
export function damp(current: number, target: number, strength: number): number {
  return current + (target - current) * strength;
}
