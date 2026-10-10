import type { Locale } from "../site";

/** Không import zod để island client dùng được. */
export function pickLocale(value: { vi: string; en?: string }, locale: Locale): string {
  return locale === "en" ? value.en || value.vi : value.vi;
}
