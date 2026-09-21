import { describe, expect, it } from 'vitest';
import { isInFrontalCone, isTutorialComplete, joystickMatchesStep, keyMatchesStep, nextStepIndex, tutorialSteps } from './state';

describe('tutorial progression', () => {
  it('keeps the hands-on sequence in the requested order', () => {
    expect(tutorialSteps.map(step => step.id)).toEqual(['forward', 'backward', 'left', 'right', 'camera', 'run', 'jump', 'model', 'guide']);
    expect(tutorialSteps.map(step => step.title)).toEqual([
      'Press W to move forward',
      'Press S to move backwards',
      'Press A to move left',
      'Press D to move right',
      'Drag to move the camera',
      'Hold Shift to run',
      'Press Space to jump',
      'Open a 3D model panel',
      'Send a message to your guide',
    ]);
  });

  it('only accepts the active key and supports either Shift key', () => {
    expect(keyMatchesStep(tutorialSteps[0], 'KeyS')).toBe(false);
    expect(keyMatchesStep(tutorialSteps[0], 'KeyW')).toBe(true);
    expect(keyMatchesStep(tutorialSteps[5], 'ShiftLeft')).toBe(true);
    expect(keyMatchesStep(tutorialSteps[5], 'ShiftRight')).toBe(true);
  });

  it('clamps completion and recognizes the touch movement equivalents', () => {
    expect(nextStepIndex(tutorialSteps.length - 1)).toBe(tutorialSteps.length);
    expect(nextStepIndex(tutorialSteps.length)).toBe(tutorialSteps.length);
    expect(isTutorialComplete(tutorialSteps.length - 1)).toBe(false);
    expect(isTutorialComplete(tutorialSteps.length)).toBe(true);
    expect(joystickMatchesStep('forward', { x: 0, z: -.8 })).toBe(true);
    expect(joystickMatchesStep('forward', { x: 0, z: .8 })).toBe(false);
  });

  it('only accepts targets in the forward cone from the character', () => {
    const origin = { x: 0, z: 0 };
    const forward = { x: 0, z: -1 };
    expect(isInFrontalCone(origin, { x: 0, z: -9 }, forward)).toBe(true);
    expect(isInFrontalCone(origin, { x: 0, z: 9 }, forward)).toBe(false);
    expect(isInFrontalCone(origin, { x: 9, z: 0 }, forward)).toBe(false);
    expect(isInFrontalCone(origin, origin, forward)).toBe(false);
    expect(isInFrontalCone(origin, { x: 0, z: -9 }, { x: 0, z: 0 })).toBe(false);
  });
});
