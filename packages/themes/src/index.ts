import type { ThemeTokens } from "@solar/tokens";
import { t15 } from "../t15/theme";
import { t12 } from "../t12/theme";

export { t15 };
export { t12 };
export const themes: readonly ThemeTokens[] = [t15, t12];

export function getTheme(id: string): ThemeTokens | undefined {
  return themes.find((theme) => theme.meta.id === id);
}

export { themeFontFamilies, themeFontFiles, themeFontCss } from "./fonts";
export type { FontFamily } from "./fonts";
