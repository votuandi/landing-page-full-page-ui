import type { ThemeTokens } from "@solar/tokens";
import { t15 } from "../t15/theme";
import { t13 } from "../t13/theme";
import { t14 } from "../t14/theme";

export { t15, t13, t14 };
export const themes: readonly ThemeTokens[] = [t15, t13, t14];

export function getTheme(id: string): ThemeTokens | undefined {
  return themes.find((theme) => theme.meta.id === id);
}

export { themeFontFamilies, themeFontFiles, themeFontCss } from "./fonts";
export type { FontFamily } from "./fonts";
