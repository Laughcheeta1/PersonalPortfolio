import { config } from '../config';
import type { Point, Obstacle } from './navigation';
import { bugHuntConfig } from './bugHuntConfig';
export function onIsland(p: Point, padding: number = config.player.radius): boolean {
  const { island, bridge } = bugHuntConfig;
  const onMainIsland = ((p.x - config.world.centerX) / (config.world.radiusX - config.world.shoreline - padding)) ** 2 + (p.z / (config.world.radiusZ - config.world.shoreline - padding)) ** 2 <= 1;
  const onMiniIsland = Math.hypot(p.x - island.x, p.z - island.z) <= island.radius - .8 - padding;
  const onBridge = p.x >= bridge.startX && p.x <= bridge.endX && Math.abs(p.z - bridge.z) <= bridge.width / 2 - padding;
  return onMainIsland || onMiniIsland || onBridge;
}
export function moveWithCollisions(position: Point, delta: Point, obstacles: Obstacle[], radius: number): Point {
  const next = { ...position };
  for (const axis of ['x', 'z'] as const) {
    const candidate = { ...next, [axis]: next[axis] + delta[axis] };
    if (onIsland(candidate, radius) && obstacles.every(o => Math.hypot(candidate.x - o.x, candidate.z - o.z) >= o.radius + radius)) next[axis] = candidate[axis];
  }
  return next;
}
export const damping = (rate: number, delta: number) => 1 - Math.exp(-rate * delta);
export function turn(current: number, target: number, alpha: number): number { return current + Math.atan2(Math.sin(target - current), Math.cos(target - current)) * alpha; }
