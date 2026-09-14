export const catRunnerConfig = {
  duration: 30,
  speed: 230,
  acceleration: 3.5,
  firstChair: .8,
  obstacleGaps: [2, 1.7, 2.3, 1.8, 2.1],
  chairStart: 670,
  chairWidth: 32,
  chairHeight: 45,
  stoolHeight: 29,
  pairWidth: 59,
  collisionInset: 3,
  runnerX: 130,
  runnerHalfWidth: 9,
  jumpVelocity: 480,
  gravity: 1500,
  heldGravity: 950,
  jumpBuffer: .12,
  meowInterval: 4,
} as const;

export interface CatRun {
  elapsed: number;
  jumpTime: number | null;
  height: number;
  velocity: number;
  jumpHeld: boolean;
  bufferedJump: number;
  status: 'ready' | 'running' | 'failed' | 'won';
}
export const newCatRun = (): CatRun => ({ elapsed: 0, jumpTime: null, height: 0, velocity: 0, jumpHeld: false, bufferedJump: 0, status: 'ready' });
export const jumpHeight = (run: CatRun): number => run.height;
export const runDistance = (elapsed: number): number => catRunnerConfig.speed * elapsed + .5 * catRunnerConfig.acceleration * elapsed ** 2;
export const runSpeed = (elapsed: number): number => catRunnerConfig.speed + catRunnerConfig.acceleration * elapsed;
export function runnerObstacles(elapsed: number): { id: number; x: number; width: number; height: number; kind: 'chair' | 'stool' | 'pair' }[] {
  const c = catRunnerConfig;
  const obstacles: ReturnType<typeof runnerObstacles> = [];
  const gaps = c.obstacleGaps;
  let id = 0;
  for (let spawn = c.firstChair; spawn < c.duration - 3; spawn += gaps[id++ % gaps.length]) {
    const x = c.chairStart - (runDistance(elapsed) - runDistance(spawn));
    const kind = id > 3 && id % 4 === 0 ? 'pair' : id % 3 === 1 ? 'stool' : 'chair';
    const width = kind === 'pair' ? c.pairWidth : c.chairWidth;
    if (elapsed >= spawn && x > -width) obstacles.push({ id, x, width, height: kind === 'chair' ? c.chairHeight : c.stoolHeight, kind });
  }
  return obstacles;
}
export const chairPositions = (elapsed: number): number[] => runnerObstacles(elapsed).map(obstacle => obstacle.x);
export function jumpCatRun(run: CatRun): CatRun {
  if (run.status !== 'running') return run;
  if (run.jumpTime !== null) return { ...run, jumpHeld: true, bufferedJump: catRunnerConfig.jumpBuffer };
  return { ...run, jumpTime: 0, velocity: catRunnerConfig.jumpVelocity, jumpHeld: true, bufferedJump: 0 };
}
export const releaseCatRun = (run: CatRun): CatRun => ({ ...run, jumpHeld: false });
export function advanceCatRun(run: CatRun, seconds: number): CatRun {
  if (run.status !== 'running') return run;
  let next = { ...run };
  const c = catRunnerConfig;
  let remaining = Math.max(0, Math.min(seconds, .1));
  while (remaining > 0) {
    const dt = Math.min(remaining, 1 / 120);
    remaining -= dt;
    next.elapsed = Math.min(c.duration, next.elapsed + dt);
    next.bufferedJump = Math.max(0, next.bufferedJump - dt);
    if (next.jumpTime !== null) {
      next.jumpTime += dt;
      const gravity = next.jumpHeld && next.velocity > 0 ? c.heldGravity : c.gravity;
      next.height += next.velocity * dt - .5 * gravity * dt * dt;
      next.velocity -= gravity * dt;
      if (next.height <= 0) {
        next.height = 0;
        next.velocity = 0;
        next.jumpTime = null;
        if (next.bufferedJump > 0) next = jumpCatRun(next);
      }
    }
    if (runnerObstacles(next.elapsed).some(o => o.x + c.collisionInset < c.runnerX + c.runnerHalfWidth && o.x + o.width - c.collisionInset > c.runnerX - c.runnerHalfWidth && next.height < o.height)) return { ...next, status: 'failed' };
    if (next.elapsed >= c.duration) return { ...next, height: 0, velocity: 0, jumpTime: null, status: 'won' };
  }
  return next;
}
