import { z } from "zod";
import { SiteSettingsError } from "@solar/db";
import { asset } from "@solar/db/collections";
import { getTheme } from "@solar/themes";
import { themeAllowed } from "@solar/plans";
import { colorChannelsToHex, RgbChannels, ThemeOverridesSchema, validateBrandOverrides, type ThemeTokens, type ThemeOverrides } from "@solar/tokens";
import { settingsAction, type SiteSettingsDeps, type SettingsInput } from "./siteSettings.ts";
import type { ActionContext } from "./action.ts";

const colorSet = z.strictObject({ primary: RgbChannels.optional(), secondary: RgbChannels.optional(), accent: RgbChannels.optional() });
export const brandOverridesSchema = z.strictObject({ colors: z.strictObject({ light: colorSet.optional(), dark: colorSet.optional() }).optional() });
const selectTheme = z.strictObject({ themeId: z.string().regex(/^[a-z0-9-]{1,40}$/) });
export function assertBrandContrast(theme: ThemeTokens, overrides: ThemeOverrides) {
  const issue = validateBrandOverrides(theme, overrides)[0];
  if (issue) {
    const labels: Record<string, string> = { primary: "Màu chính", secondary: "Màu phụ", accent: "Màu nhấn" };
    throw new SiteSettingsError(`${labels[issue.key] ?? issue.key} (${issue.mode === "light" ? "sáng" : "tối"}) chỉ đạt ${issue.ratio.toFixed(1).replace(".", ",")}:1 với chữ trên nền, cần ≥ 4,5:1. Gợi ý: ${colorChannelsToHex(issue.suggestion)}`, 400);
  }
}
export function createAppearanceHandlers(deps: SiteSettingsDeps) {
  const run = (input: SettingsInput, context: ActionContext, work: Parameters<typeof settingsAction>[4]) => settingsAction("theme.manage", input, context, deps, work);
  const allowedTheme = (raw: unknown, planId: string) => {
    const { themeId } = selectTheme.parse(raw), theme = getTheme(themeId);
    if (!theme) throw new SiteSettingsError("Giao diện không tồn tại", 400);
    if (!themeAllowed(planId, theme.meta.group)) throw new SiteSettingsError("Giao diện này nằm ngoài gói hiện tại", 403);
    return theme;
  };
  return {
    theme: (input: SettingsInput, context: ActionContext) => run(input, context, async (raw, site, _can, save) => {
      const theme = allowedTheme(raw, site.planId);
      assertBrandContrast(theme, ThemeOverridesSchema.parse(site.themeOverrides));
      return save({ themeId: theme.meta.id });
    }),
    colors: (input: SettingsInput, context: ActionContext) => run(input, context, async (raw, site, can, save) => {
      if (!can("themeOverride")) throw new SiteSettingsError("Gói hiện tại không hỗ trợ màu thương hiệu", 403);
      const overrides = brandOverridesSchema.parse(raw, { error: z.locales.vi().localeError }), theme = getTheme(site.themeId);
      if (!theme) throw new SiteSettingsError("Giao diện không tồn tại", 400);
      if (!theme.meta.supportsDark && Object.keys(overrides.colors?.dark ?? {}).length) throw new SiteSettingsError("Giao diện không hỗ trợ chế độ tối", 400);
      assertBrandContrast(theme, overrides);
      return save({ themeOverrides: overrides });
    }),
    logos: (input: SettingsInput, context: ActionContext) => run(input, context, async (raw, site, _can, save) => {
      const data = z.strictObject({ logo: asset.optional(), logoDark: asset.optional() }).parse(raw, { error: z.locales.vi().localeError });
      const profile = z.record(z.string(), z.unknown()).parse(site.profile);
      const brand = z.record(z.string(), z.unknown()).parse(profile.brand ?? {});
      const { logo: _logo, logoDark: _dark, ...rest } = brand;
      return save({ profile: { ...profile, brand: { ...rest, ...data } } });
    }),
    preview: (input: SettingsInput, context: ActionContext) => run(input, context, async (raw, site) => {
      const theme = allowedTheme(raw, site.planId);
      assertBrandContrast(theme, ThemeOverridesSchema.parse(site.themeOverrides));
      const url = new URL(await deps.preview(context.tenantId, site.id, context.slug));
      url.searchParams.set("theme", theme.meta.id);
      return { ok: true, url: url.toString() };
    }),
  };
}
