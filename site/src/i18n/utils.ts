import { ui, defaultLang, type Lang } from './ui';

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as Lang;
  return defaultLang;
}

export function getLocale(currentLocale: string | undefined): Lang {
  if (currentLocale && currentLocale in ui) return currentLocale as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return ui[lang]?.[key] ?? ui[defaultLang][key];
  };
}

export function useTranslatedPath(lang: Lang) {
  return function translatePath(path: string, l: Lang = lang) {
    return l === defaultLang ? path : `/${l}${path}`;
  };
}

export function getDateLocale(lang: Lang): string {
  return lang === 'es' ? 'es-ES' : 'en-US';
}

/**
 * Format a content date for display.
 *
 * Content dates are bare `YYYY-MM-DD`, which `z.coerce.date()` parses as UTC midnight.
 * Formatting one without `timeZone: 'UTC'` renders it in the *build machine's* zone, so
 * any negative offset rolls it back a day — every note was showing one day early. Keep
 * the option: it is the whole reason this helper exists rather than four call sites.
 */
export function formatDate(date: Date, lang: Lang): string {
  return date.toLocaleDateString(getDateLocale(lang), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Machine-readable `YYYY-MM-DD` for a `<time datetime>` attribute. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function switchLangUrl(url: URL, targetLang: Lang): string {
  const currentLang = getLangFromUrl(url);
  const pathname = url.pathname;

  if (currentLang === defaultLang) {
    return targetLang === defaultLang ? pathname : `/${targetLang}${pathname}`;
  }

  const withoutLang = pathname.replace(`/${currentLang}`, '') || '/';
  return targetLang === defaultLang ? withoutLang : `/${targetLang}${withoutLang}`;
}
