export type TutorialStepKind = 'key' | 'look';

export const tutorialSteps = [
  { id: 'forward', kind: 'key', code: 'KeyW', keyLabel: 'W', title: 'Press W to move forward' },
  { id: 'backward', kind: 'key', code: 'KeyS', keyLabel: 'S', title: 'Press S to move backwards' },
  { id: 'left', kind: 'key', code: 'KeyA', keyLabel: 'A', title: 'Press A to move left' },
  { id: 'right', kind: 'key', code: 'KeyD', keyLabel: 'D', title: 'Press D to move right' },
  { id: 'camera', kind: 'look', keyLabel: 'DRAG', title: 'Drag to move the camera' },
  { id: 'run', kind: 'key', code: 'Shift', keyLabel: 'shift', title: 'Hold Shift to run' },
  { id: 'jump', kind: 'key', code: 'Space', keyLabel: 'space', title: 'Press Space to jump' },
] as const satisfies readonly {
  id: string;
  kind: TutorialStepKind;
  code?: string;
  keyLabel: string;
  title: string;
}[];

export type TutorialStepId = typeof tutorialSteps[number]['id'];

export function keyMatchesStep(step: typeof tutorialSteps[number], code: string): boolean {
  if (step.id === 'run') return code === 'ShiftLeft' || code === 'ShiftRight';
  return step.kind === 'key' && step.code === code;
}

export function nextStepIndex(stepIndex: number): number {
  return Math.min(stepIndex + 1, tutorialSteps.length);
}

export function isTutorialComplete(stepIndex: number): boolean {
  return stepIndex >= tutorialSteps.length;
}

export const movementStepDirections: Record<Extract<TutorialStepId, 'forward' | 'backward' | 'left' | 'right'>, { x: number; z: number }> = {
  forward: { x: 0, z: -1 },
  backward: { x: 0, z: 1 },
  left: { x: -1, z: 0 },
  right: { x: 1, z: 0 },
};

export function joystickMatchesStep(stepId: string, joystick: { x: number; z: number }, threshold = .35): boolean {
  const direction = movementStepDirections[stepId as keyof typeof movementStepDirections];
  if (!direction) return false;
  return joystick.x * direction.x + joystick.z * direction.z >= threshold;
}

/** Returns true when a target is inside the forward horizontal cone from an origin. */
export function isInFrontalCone(origin: { x: number; z: number }, target: { x: number; z: number }, forward: { x: number; z: number }, minimumDot = .975): boolean {
  const targetX = target.x - origin.x;
  const targetZ = target.z - origin.z;
  const targetLength = Math.hypot(targetX, targetZ);
  const forwardLength = Math.hypot(forward.x, forward.z);
  if (targetLength === 0 || forwardLength === 0) return false;
  return (targetX * forward.x + targetZ * forward.z) / (targetLength * forwardLength) >= minimumDot;
}
