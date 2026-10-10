import type { ThemeTokens } from "@solar/tokens";
import { FONTS } from "./fonts.generated";

export type FontFamily = keyof typeof FONTS;

type FontFile = {
  readonly file: string;
  readonly weight: string;
  readonly minWeight: number;
  readonly maxWeight: number;
  readonly unicodeRange: string;
};

export function themeFontFamilies(theme: ThemeTokens): FontFamily[] {
  return [...new Set([theme.font.sans, theme.font.display])].map((family) => {
    if (!Object.prototype.hasOwnProperty.call(FONTS, family)) {
      throw new Error(`Font family is not allowed: ${family}`);
    }
    return family as FontFamily;
  });
}

function familyFiles(family: FontFamily, weights: readonly number[]): FontFile[] {
  const files: readonly FontFile[] = FONTS[family].files;
  const covers = (file: FontFile, weight: number) => weight >= file.minWeight && weight <= file.maxWeight;
  for (const weight of weights) {
    if (!files.some((file) => covers(file, weight))) {
      throw new Error(`Font ${family} does not support weight ${weight}`);
    }
  }
  return files.filter((file) => weights.some((weight) => covers(file, weight)));
}

export function themeFontFiles(theme: ThemeTokens): string[] {
  return themeFontFamilies(theme).flatMap((family) =>
    familyFiles(family, theme.font.weights).map(({ file }) => file));
}

export function themeFontCss(theme: ThemeTokens, baseUrl = "/fonts/"): string {
  if (!/^\/[\w/-]*\/$/.test(baseUrl) || !baseUrl.endsWith("/")) {
    throw new Error("Invalid font baseUrl: expected an absolute directory path");
  }
  const css = themeFontFamilies(theme).map((family) => {
    const faces = familyFiles(family, theme.font.weights).map(({ file, weight, unicodeRange }) =>
      `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url("${baseUrl}${file}") format("woff2");unicode-range:${unicodeRange};}`).join("");
    const metrics = FONTS[family].fallback;
    return faces + `@font-face{font-family:"${family} Fallback";src:local("Arial");font-display:swap;ascent-override:${metrics.ascentOverride};descent-override:${metrics.descentOverride};line-gap-override:${metrics.lineGapOverride};size-adjust:${metrics.sizeAdjust};}`;
  }).join("");
  return css + `:root{--font-sans:"${theme.font.sans}","${theme.font.sans} Fallback";--font-display:"${theme.font.display}","${theme.font.display} Fallback"}`;
}
