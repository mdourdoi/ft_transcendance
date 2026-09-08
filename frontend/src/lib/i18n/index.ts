import { register, init, locale, getLocaleFromNavigator } from "svelte-i18n";

export const SUPPORTED_LOCALES = ["en", "fr"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const STORAGE_KEY = "locale";
const FALLBACK: Locale = "en";

for (const locale of SUPPORTED_LOCALES) {
  register(locale, () => import(`./locales/${locale}.json`));
}

function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function detect(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {}
  const nav = getLocaleFromNavigator()?.slice(0, 2);
  return isLocale(nav) ? nav : FALLBACK;
}

const initial = detect();

init({ fallbackLocale: FALLBACK, initialLocale: initial });

locale.subscribe((value) => {
  if (!isLocale(value)) return;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {}
  if (typeof document !== "undefined") {
    document.documentElement.lang = value;
  }
});

export { locale };
export { _ as t, isLoading, waitLocale } from "svelte-i18n";
