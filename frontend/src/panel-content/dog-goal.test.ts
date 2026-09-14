import { describe, expect, it } from 'vitest';
import { advanceDogGoal, aimDogGoal, dogGoalConfig as tuning, dogGoalFinished, goalCenter, newDogGoal, pressDogGoal, shotDuration, type DogGoalState } from './dog-goal';

function advance(state: DogGoalState, seconds: number): DogGoalState {
  let next = state;
  for (let remaining = seconds; remaining > 1e-9 && !dogGoalFinished(next.phase); remaining -= 1 / 120) next = advanceDogGoal(next, Math.min(remaining, 1 / 120));
  return next;
}
function shoot(x: number, y: number, power: number, state = newDogGoal()) {
  return pressDogGoal(advance(pressDogGoal(aimDogGoal(state, x, y)), power * tuning.chargeDuration));
}

describe('dog penalty shootout', () => {
  it('keeps the goal fixed and lets the player aim without racing an arrow', () => {
    const aimed = aimDogGoal(newDogGoal(), 415, 75);
    const waiting = advance(aimed, 5);
    expect(waiting.aimX).toBe(415);
    expect(waiting.aimY).toBe(75);
    expect(goalCenter()).toBe(320);
    expect(waiting.dogX).toBe(320);
  });
  it('caps charge and makes a powered strike faster', () => {
    expect(advance(pressDogGoal(newDogGoal()), 3).power).toBe(1);
    expect(shotDuration(shoot(415, 75, 1))).toBeLessThan(shotDuration(shoot(415, 75, .1)));
  });
  it('locks aim in flight and gives the keeper a real reaction delay', () => {
    const shot = shoot(415, 75, .8);
    expect(aimDogGoal(shot, 320, 140)).toBe(shot);
    expect(pressDogGoal(shot)).toBe(shot);
    const delayed = advance(shot, tuning.reactionDelay);
    expect(delayed.dogX).toBe(320);
    expect(delayed.dogY).toBe(145);
    expect(advance(delayed, .1).dogX).toBeGreaterThan(320);
  });
  it.each([[215, 70], [425, 70], [215, 160], [425, 160]])('allows a strong corner shot at %s, %s to score', (x, y) => {
    const result = advance(shoot(x, y, .85), 2);
    expect(result.phase).toBe('goal');
    expect(result.goals).toBe(1);
    expect(result.attempts).toBe(1);
    expect(Math.abs(result.dogX - 320)).toBeLessThanOrEqual(tuning.maxDive);
  });
  it('saves weak central shots and rewards more power on a reachable side shot', () => {
    expect(advance(shoot(320, 140, .1), 2).phase).toBe('saved');
    expect(advance(shoot(400, 140, .1), 2).phase).toBe('saved');
    expect(advance(shoot(400, 140, .9), 2).phase).toBe('goal');
  });
  it.each([[190, 120], [450, 120], [320, 40], [320, 190]])('marks outside shots at %s, %s as misses', (x, y) => {
    expect(advance(shoot(x, y, 1), 2).phase).toBe('miss');
  });
  it('preserves the score across five penalties and resets on replay', () => {
    let state = newDogGoal();
    for (let index = 0; index < tuning.shotsPerMatch; index += 1) {
      state = advance(shoot(index < 3 ? 425 : 320, index < 3 ? 70 : 140, .9, state), 2);
      expect(state.attempts).toBe(index + 1);
      expect(advanceDogGoal(state, 1 / 60)).toBe(state);
      if (index < tuning.shotsPerMatch - 1) state = pressDogGoal(state);
    }
    expect(state.goals).toBe(tuning.goalsToWin);
    expect(state.results).toEqual(['goal', 'goal', 'goal', 'saved', 'saved']);
    expect(pressDogGoal(state)).toEqual(newDogGoal());
  });
});
