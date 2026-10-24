import type { ThemeTokens } from "@solar/tokens";
import { t15 } from "../t15/theme";
import { t01 } from "../t01/theme";
import { t02 } from "../t02/theme";
import { t03 } from "../t03/theme";
import { t04 } from "../t04/theme";
import { t05 } from "../t05/theme";
import { t06 } from "../t06/theme";
import { t07 } from "../t07/theme";
import { t08 } from "../t08/theme";
import { t09 } from "../t09/theme";
import { t10 } from "../t10/theme";
import { t11 } from "../t11/theme";
import { t12 } from "../t12/theme";
import { t13 } from "../t13/theme";
import { t14 } from "../t14/theme";

export { adminTheme } from "../admin/theme";

export { t15, t01, t02, t03, t04, t05, t06, t07, t08, t09, t10, t11, t12, t13, t14 };
export const themes: readonly ThemeTokens[] = [t15, t01, t02, t03, t04, t05, t06, t07, t08, t09, t10, t11, t12, t13, t14];

export function getTheme(id: string): ThemeTokens | undefined {
  return themes.find((theme) => theme.meta.id === id);
}

export { FONT_FAMILIES, withFontOverride, themeFontFamilies, themeFontFiles, themeFontCss } from "./fonts";
export type { FontFamily } from "./fonts";
