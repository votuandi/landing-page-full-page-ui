import type { ThemeTokens } from "@solar/tokens";
import { t15 } from "../t15/theme";
import { t13 } from "../t13/theme";
import { t14 } from "../t14/theme";

import { t05 } from "../t05/theme";
import { t06 } from "../t06/theme";
import { t09 } from "../t09/theme";

export { t15, t13, t14, t05, t06, t09 };
export const themes: readonly ThemeTokens[] = [t15, t13, t14, t05, t06, t09];

export function getTheme(id: string): ThemeTokens | undefined {
  return themes.find((theme) => theme.meta.id === id);
}

export { themeFontFamilies, themeFontFiles, themeFontCss } from "./fonts";
export type { FontFamily } from "./fonts";
