import { describe, expect, test } from 'bun:test';

import { getLocaleMessages, SUPPORTED_LOCALES, translate } from './messages';

describe('i18n messages', () => {
  test('all locales include all english keys', () => {
    const englishKeys = Object.keys(getLocaleMessages('en')).sort();

    for (const locale of SUPPORTED_LOCALES) {
      const localeKeys = Object.keys(getLocaleMessages(locale)).sort();
      expect(localeKeys).toEqual(englishKeys);
    }
  });

  test('translate interpolates variables', () => {
    expect(
      translate('en', 'runtime.loading.loadingModel', {
        loaded: 1,
        total: 6,
        model: 'Example',
      }),
    ).toBe('Loading model 1/6: Example');
  });

  test('translate falls back to english when key is missing in locale', () => {
    expect(translate('es', 'not.a.real.key')).toBe('not.a.real.key');
  });
});

