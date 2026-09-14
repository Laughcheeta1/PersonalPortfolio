import { describe, expect, it } from 'vitest';
import { advanceCatRun, catRunnerConfig, chairPositions, jumpCatRun, newCatRun, releaseCatRun, runnerObstacles, runSpeed, type CatRun } from './cat-runner';

describe('cat dinner journey', () => {
  it('waits for start, collides with a chair, and freezes after failure', () => {
    expect(advanceCatRun(newCatRun(), .1)).toEqual(newCatRun());
    let run: CatRun = { ...newCatRun(), status: 'running' };
    for (let i = 0; i < 300; i++) run = advanceCatRun(run, 1 / 60);
    expect(run.status).toBe('failed');
    expect(advanceCatRun(run, .1)).toEqual(run);
  });
  it('can jump over every chair and finish at the food', () => {
    let run: CatRun = { ...newCatRun(), status: 'running' };
    let jumps = 0;
    for (let i = 0; i < catRunnerConfig.duration * 60 + 60; i++) {
      if (run.jumpTime === null && chairPositions(run.elapsed).some(x => x > catRunnerConfig.runnerX && x < catRunnerConfig.runnerX + 100)) {
        run = jumpCatRun(run);
        jumps++;
      }
      run = advanceCatRun(run, 1 / 60);
    }
    expect(jumps).toBeGreaterThan(5);
    expect(run.status).toBe('won');
    expect(run.elapsed).toBe(catRunnerConfig.duration);
    expect(advanceCatRun(run, .1)).toEqual(run);
  });
  it('can finish with short hops for stools and held jumps for chairs', () => {
    let run: CatRun = { ...newCatRun(), status: 'running' };
    for (let i = 0; i < catRunnerConfig.duration * 60 + 60; i++) {
      const upcoming = runnerObstacles(run.elapsed).find(obstacle => obstacle.x > catRunnerConfig.runnerX && obstacle.x < catRunnerConfig.runnerX + 85);
      if (run.jumpTime === null && upcoming) {
        run = jumpCatRun(run);
        if (upcoming.kind === 'stool') run = releaseCatRun(run);
      }
      run = advanceCatRun(run, 1 / 60);
    }
    expect(run.status).toBe('won');
  });
  it('a held jump rises higher than a tap and both land cleanly', () => {
    let held = jumpCatRun({ ...newCatRun(), status: 'running' });
    let tapped = releaseCatRun(held);
    let heldPeak = 0;
    let tappedPeak = 0;
    for (let i = 0; i < 90; i++) {
      held = advanceCatRun(held, 1 / 120);
      tapped = advanceCatRun(tapped, 1 / 120);
      heldPeak = Math.max(heldPeak, held.height);
      tappedPeak = Math.max(tappedPeak, tapped.height);
    }
    expect(heldPeak).toBeGreaterThan(tappedPeak + 35);
    expect(tappedPeak).toBeGreaterThan(70);
    for (let i = 0; i < 60; i++) held = advanceCatRun(held, 1 / 120);
    expect(held.height).toBe(0);
    expect(tapped.height).toBe(0);
  });
  it('buffers a jump just before landing without allowing a double jump', () => {
    let run = releaseCatRun(jumpCatRun({ ...newCatRun(), status: 'running' }));
    for (let i = 0; i < 36; i++) run = advanceCatRun(run, 1 / 60);
    expect(run.height).toBeGreaterThan(0);
    const height = run.height;
    run = jumpCatRun(run);
    expect(run.height).toBe(height);
    for (let i = 0; i < 6; i++) run = advanceCatRun(run, 1 / 60);
    expect(run.velocity).toBeGreaterThan(0);
  });
  it('varies obstacle shapes and increases the pace gradually', () => {
    const kinds = new Set<string>();
    for (let elapsed = 0; elapsed < catRunnerConfig.duration; elapsed += .5) {
      runnerObstacles(elapsed).forEach(obstacle => kinds.add(obstacle.kind));
    }
    expect(kinds.size).toBe(3);
    expect(runSpeed(20)).toBeGreaterThan(runSpeed(0));
  });
  it('does not allow midair jumps or a jump after failure', () => {
    const airborne = jumpCatRun({ ...newCatRun(), status: 'running' });
    expect(jumpCatRun(advanceCatRun(airborne, .1)).jumpTime).toBeCloseTo(.1);
    const failed: CatRun = { ...newCatRun(), status: 'failed' };
    expect(jumpCatRun(failed)).toEqual(failed);
  });
});
