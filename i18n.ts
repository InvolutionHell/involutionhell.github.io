export const locales = ["en", "zh"] as const;
export const defaultLocale = "en";

export const i18n = {
  locales,
  defaultLocale,
} as const;

export type Locale = (typeof locales)[number];
