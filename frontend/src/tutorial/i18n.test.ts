import { describe, expect, it } from 'vitest';
import { getTutorialCopy } from './i18n';
import { tutorialSteps } from './state';

describe('tutorial translations', () => {
  it('provides Spanish copy for every stage and the hand guide', () => {
    const english = getTutorialCopy('en');
    const spanish = getTutorialCopy('es');

    expect(Object.keys(spanish.steps)).toEqual(tutorialSteps.map(step => step.id));
    for (const step of tutorialSteps) {
      expect(spanish.steps[step.id].title).not.toBe(english.steps[step.id].title);
      expect(spanish.steps[step.id].body).not.toBe(english.steps[step.id].body);
      expect(spanish.steps[step.id].route).not.toBe(english.steps[step.id].route);
    }
    expect(spanish.fingerGuide.title).not.toBe(english.fingerGuide.title);
    expect(spanish.fingerGuide.handAlt).not.toBe(english.fingerGuide.handAlt);
    expect(spanish.complete.enter).not.toBe(english.complete.enter);
  });
});
