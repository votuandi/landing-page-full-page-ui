import type { CalculatorPrefill } from "@solar/core";
import type { Locale } from "../site";
import { resolveLink, type Link } from "../fields/link";
import { pickLocale } from "../fields/localized";

/** Link đã resolve ở server để island không phải import zod/schema. */
export type ClientLink = { label: string; href: string; external: boolean; calculator?: CalculatorPrefill };

export const toClientLink = (link: Link, locale: Locale): ClientLink =>
  ({ label: pickLocale(link.label, locale), ...resolveLink(link) });
