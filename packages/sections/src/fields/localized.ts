import { z } from "zod";
import type { Locale } from "../site";
import { fieldRegistry } from "./widget";

export function localized(opts: { multiline?: boolean; max?: number } = {}) {
  const text = opts.max === undefined ? z.string() : z.string().max(opts.max);
  return z.object({ vi: text, en: text.optional() }).register(fieldRegistry, {
    widget: opts.multiline ? "localizedTextarea" : "localized",
  });
}

export type Localized = z.output<ReturnType<typeof localized>>;

export function pickLocale(value: Localized, locale: Locale): string {
  return locale === "en" ? value.en || value.vi : value.vi;
}
