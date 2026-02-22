import { describe, expect, test } from 'bun:test';

import { getProfessionalProfile, getSceneInformationCategories } from './index';

describe('localized information data', () => {
  test('loads localized profile content per locale', () => {
    expect(getProfessionalProfile('en').personalInformation.hobbies[0]?.title).toBe('Reading');
    expect(getProfessionalProfile('es').personalInformation.hobbies[0]?.title).toBe('Lectura');
    expect(getProfessionalProfile('fr').personalInformation.hobbies[0]?.title).toBe('Lecture');
    expect(getProfessionalProfile('zh').personalInformation.hobbies[0]?.title).toBe('阅读');
  });

  test('loads localized scene item content per locale', () => {
    const enItem = getSceneInformationCategories('en')[0]?.subcategories[0]?.items[0];
    const esItem = getSceneInformationCategories('es')[0]?.subcategories[0]?.items[0];

    expect(enItem?.title).toContain('University Selected Tutor');
    expect(esItem?.title).toContain('Tutor seleccionado');
  });
});

