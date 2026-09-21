import { describe, expect, it } from 'vitest';
import { config } from '../config';
import { createEnvironment } from './environment';
import { bugHuntConfig } from './bugHuntConfig';
import { moveWithCollisions, onIsland } from './physics';

describe('bug hunt island access', () => {
  it('provides a continuous obstacle-free walk from the road junction to the arena and back', () => {
    const obstacles = createEnvironment().obstacles;
    let position: { x: number; z: number } = { x: 29, z: bugHuntConfig.bridge.z };
    for (let i = 0; i < 450; i++) {
      const next = moveWithCollisions(position, { x: .1, z: 0 }, obstacles, config.player.radius);
      expect(next.x).toBeGreaterThan(position.x);
      position = next;
    }
    expect(position.x).toBeCloseTo(bugHuntConfig.island.x);
    for (let i = 0; i < 450; i++) {
      const next = moveWithCollisions(position, { x: -.1, z: 0 }, obstacles, config.player.radius);
      expect(next.x).toBeLessThan(position.x);
      position = next;
    }
    expect(position.x).toBeCloseTo(29);
  });

  it('blocks walking off the bridge and island shoreline', () => {
    const bridgeEdge = { x: 60, z: bugHuntConfig.bridge.z + bugHuntConfig.bridge.width / 2 - config.player.radius - .001 };
    expect(onIsland(bridgeEdge)).toBe(true);
    expect(moveWithCollisions(bridgeEdge, { x: 0, z: .2 }, [], config.player.radius)).toEqual(bridgeEdge);
    expect(onIsland({ x: 74, z: 12 })).toBe(false);
    expect(onIsland({ x: 74, z: 0 })).toBe(true);
    expect(onIsland({ x: 60, z: 7 })).toBe(false);
  });
});
