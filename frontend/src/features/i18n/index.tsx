import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  type Locale,
  persistLocale,
  resolvePreferredLocale,
  SUPPORTED_LOCALES,
  translate,
} from './messages';
import { I18nContext, type I18nContextValue } from './useI18n';

type TranslationValues = Record<string, string | number>;

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => resolvePreferredLocale());

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    persistLocale(nextLocale);
  }, []);

  const t = useCallback((key: string, values?: TranslationValues) => {
    return translate(locale, key, values);
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      supportedLocales: SUPPORTED_LOCALES,
      t,
    }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export type { Locale } from './messages';
