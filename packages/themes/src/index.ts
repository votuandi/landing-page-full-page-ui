import type { ThemeTokens } from "@solar/tokens";
import { t15 } from "../t15/theme";
import { t10 } from "../t10/theme";

export { t15 };
export { t10 };
export const themes: readonly ThemeTokens[] = [t15, t10];

export function getTheme(id: string): ThemeTokens | undefined {
  return themes.find((theme) => theme.meta.id === id);
}

export { themeFontFamilies, themeFontFiles, themeFontCss } from "./fonts";
export type { FontFamily } from "./fonts";
