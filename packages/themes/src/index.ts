import type { ThemeTokens } from "@solar/tokens";
import { t15 } from "../t15/theme";
import { t12 } from "../t12/theme";
import { t13 } from "../t13/theme";
import { t14 } from "../t14/theme";

import { t01 } from "../t01/theme";
import { t02 } from "../t02/theme";
import { t03 } from "../t03/theme";
import { t04 } from "../t04/theme";

export { t15, t12, t13, t14, t01, t02, t03, t04 };
export const themes: readonly ThemeTokens[] = [t15, t12, t13, t14, t01, t02, t03, t04];

export function getTheme(id: string): ThemeTokens | undefined {
  return themes.find((theme) => theme.meta.id === id);
}

export { themeFontFamilies, themeFontFiles, themeFontCss } from "./fonts";
export type { FontFamily } from "./fonts";
