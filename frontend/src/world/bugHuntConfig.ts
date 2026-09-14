import { config } from '../config';

// Continue the main road at its endpoint instead of offsetting the connection.
const roadEndZ = Math.sin(config.navigation.roadEnd * config.navigation.curveFrequency) * config.navigation.curveAmplitude;

/** Shared spatial and gameplay tuning for the bug hunt extension. */
export const bugHuntConfig = {
  island: { x: 74, z: 0, radius: 12 },
  bridge: { startX: config.navigation.roadEnd, endX: 65, z: roadEndZ, width: 3.6 },
  leaderboard: { x: 67, z: roadEndZ + 4.4, y: 3.3, rotationY: -Math.PI / 2, width: 5.2, height: 4.2 },
  arenaRadius: 9,
  bugCount: 8,
  bugSpeed: 2.8,
  attackRange: 2.6,
  attackCooldown: .45,
  attackDuration: .32,
} as const;

/** Keep procedural decoration away from the entire approach to the bridge. */
export function onBugHuntApproach(x: number, z: number, padding = 2): boolean {
  const b = bugHuntConfig.bridge;
  return x >= b.startX - 5 - padding && x <= b.endX + padding && Math.abs(z - b.z) <= b.width / 2 + padding;
}
