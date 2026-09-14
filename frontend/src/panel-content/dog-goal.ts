export const dogGoalConfig = {
  goalWidth: 250, goalTop: 48, goalBottom: 182, ballRadius: 7,
  reactionDelay: .22, dogSpeed: 125, dogJumpSpeed: 105,
  dogHighestReach: 85, catchRadius: 32, maxDive: 82,
  chargeDuration: 1.1, minFlightDuration: .48, maxFlightDuration: 1.1,
  shotsPerMatch: 5, goalsToWin: 3,
} as const;

export type DogGoalPhase = 'aim' | 'charging' | 'flight' | 'goal' | 'saved' | 'miss';
export interface DogGoalState {
  time: number; phase: DogGoalPhase; aimX: number; aimY: number;
  flight: number; dogX: number; dogY: number; power: number;
  goals: number; attempts: number; results: Array<'goal' | 'saved' | 'miss'>;
}
export const goalCenter = (): number => 320;
export const newDogGoal = (): DogGoalState => ({
  time: 0, phase: 'aim', aimX: 400, aimY: 90, flight: 0, dogX: 320, dogY: 145,
  power: 0, goals: 0, attempts: 0, results: [],
});
export const dogGoalFinished = (phase: DogGoalPhase): boolean => ['goal', 'saved', 'miss'].includes(phase);
export const shotDuration = (state: DogGoalState): number => dogGoalConfig.maxFlightDuration - state.power * (dogGoalConfig.maxFlightDuration - dogGoalConfig.minFlightDuration);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export function aimDogGoal(state: DogGoalState, x: number, y: number): DogGoalState {
  if (state.phase !== 'aim' && state.phase !== 'charging') return state;
  return { ...state, aimX: clamp(x, 175, 465), aimY: clamp(y, 30, 195) };
}
export function pressDogGoal(state: DogGoalState): DogGoalState {
  if (state.phase === 'aim') return { ...state, phase: 'charging', power: 0 };
  if (state.phase === 'charging') return { ...state, phase: 'flight', flight: 0 };
  if (state.phase === 'flight') return state;
  const fresh = newDogGoal();
  return state.attempts >= dogGoalConfig.shotsPerMatch ? fresh : { ...fresh, time: state.time, goals: state.goals, attempts: state.attempts, results: state.results };
}
const approach = (current: number, target: number, step: number) => current + Math.sign(target - current) * Math.min(Math.abs(target - current), step);
export function advanceDogGoal(state: DogGoalState, seconds: number): DogGoalState {
  if (dogGoalFinished(state.phase)) return state;
  const dt = clamp(seconds, 0, .05);
  const next = { ...state, time: state.time + dt };
  const c = dogGoalConfig;
  if (state.phase === 'charging') next.power = Math.min(1, state.power + dt / c.chargeDuration);
  if (state.phase !== 'flight') return next;
  const duration = shotDuration(state);
  next.flight = Math.min(duration, state.flight + dt);
  const reactionTime = Math.max(0, next.flight - Math.max(state.flight, c.reactionDelay));
  next.dogX = approach(state.dogX, clamp(state.aimX, 320 - c.maxDive, 320 + c.maxDive), c.dogSpeed * reactionTime);
  next.dogY = approach(state.dogY, clamp(state.aimY, c.dogHighestReach, 160), c.dogJumpSpeed * reactionTime);
  if (next.flight >= duration) {
    const inside = Math.abs(next.aimX - goalCenter()) < c.goalWidth / 2 - c.ballRadius && next.aimY > c.goalTop + c.ballRadius && next.aimY < c.goalBottom - c.ballRadius;
    const caught = Math.hypot(next.dogX - next.aimX, next.dogY - next.aimY) <= c.catchRadius;
    next.phase = !inside ? 'miss' : caught ? 'saved' : 'goal';
    next.attempts += 1;
    next.goals += next.phase === 'goal' ? 1 : 0;
    next.results = [...state.results, next.phase];
  }
  return next;
}
