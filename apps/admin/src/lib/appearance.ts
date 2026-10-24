import { z } from "zod";
import { SiteSettingsError } from "@solar/db";
import { asset } from "@solar/db/collections";
import { getTheme, FONT_FAMILIES, withFontOverride, themeFontFiles } from "@solar/themes";
import { themeAllowed } from "@solar/plans";
import { BRAND_COLOR_KEYS, colorChannelsToHex, RgbChannels, ThemeOverridesSchema, validateBrandOverrides, type ThemeTokens, type ThemeOverrides } from "@solar/tokens";
import { settingsAction, type SiteSettingsDeps, type SettingsInput } from "./siteSettings.ts";
import type { ActionContext } from "./action.ts";

const colorSet = z.object({ primary: RgbChannels.optional(), secondary: RgbChannels.optional(), accent: RgbChannels.optional() });
export const brandOverridesSchema = z.strictObject({ colors: z.strictObject({ light: colorSet.optional(), dark: colorSet.optional() }).optional() });
const selectTheme = z.strictObject({ themeId: z.string().regex(/^[a-z0-9-]{1,40}$/) });
export function assertBrandContrast(theme: ThemeTokens, overrides: ThemeOverrides) {
  const issue = validateBrandOverrides(theme, overrides)[0];
  if (issue) {
    const labels: Record<string, string> = { primary: "Màu chính", secondary: "Màu phụ", accent: "Màu nhấn" };
    throw new SiteSettingsError(`${labels[issue.key] ?? issue.key} (${issue.mode === "light" ? "sáng" : "tối"}) chỉ đạt ${issue.ratio.toFixed(1).replace(".", ",")}:1 với chữ trên nền, cần ≥ 4,5:1. Gợi ý: ${colorChannelsToHex(issue.suggestion)}`, 400);
  }
}
export function assertOverrides(theme: ThemeTokens, overrides: ThemeOverrides) {
  assertBrandContrast(theme, overrides);
  if (!withFontOverride(theme, overrides.font)) {
    let reason = "Font không thuộc danh sách cho phép";
    try { themeFontFiles({ ...theme, font: { ...theme.font, ...overrides.font } }); }
    catch (error) { if (error instanceof Error && /weight \d+/.test(error.message)) reason = `Font ${Object.values(overrides.font ?? {}).join(", ")} thiếu độ đậm ${error.message.match(/weight (\d+)/)?.[1]}`; }
    throw new SiteSettingsError(`${reason}. Gợi ý: chọn font khác hoặc đặt font theo theme trước khi đổi giao diện.`, 400);
  }
}
export type AppearanceDeps = SiteSettingsDeps & {
  media(tenantId: string, id: string): Promise<{ status: string; mime: string } | null>;
};
export function createAppearanceHandlers(deps: AppearanceDeps) {
  const run = (input: SettingsInput, context: ActionContext, work: Parameters<typeof settingsAction>[4]) => settingsAction("theme.manage", input, context, deps, work);
  const allowedTheme = (raw: unknown, planId?: string) => {
    const { themeId } = selectTheme.parse(raw), theme = getTheme(themeId);
    if (!theme) throw new SiteSettingsError("Giao diện không tồn tại", 400);
    if (planId !== undefined && !themeAllowed(planId, theme.meta.group)) throw new SiteSettingsError("Giao diện này nằm ngoài gói hiện tại", 403);
    return theme;
  };
  return {
    theme: (input: SettingsInput, context: ActionContext) => run(input, context, async (raw, site, can, save) => {
      const theme = allowedTheme(raw, site.planId);
      if (can("themeOverride")) assertOverrides(theme, ThemeOverridesSchema.parse(site.themeOverrides));
      return save({ themeId: theme.meta.id });
    }),
    fonts: (input: SettingsInput, context: ActionContext) => run(input, context, async (raw, site, can, save) => {
      if (!can("themeOverride")) throw new SiteSettingsError("Gói hiện tại không hỗ trợ font thương hiệu", 403);
      const font = ThemeOverridesSchema.shape.font.unwrap().parse(raw, { error: z.locales.vi().localeError });
      if (Object.values(font).some(family => !FONT_FAMILIES.includes(family as typeof FONT_FAMILIES[number]))) throw new SiteSettingsError("Font không thuộc danh sách cho phép", 400);
      const theme = getTheme(site.themeId);
      if (!theme) throw new SiteSettingsError("Giao diện không tồn tại", 400);
      const overrides = ThemeOverridesSchema.parse(site.themeOverrides);
      if (Object.keys(font).length) overrides.font = font;
      else delete overrides.font;
      assertOverrides(theme, overrides);
      return save({ themeOverrides: overrides });
    }),
    favicon: (input: SettingsInput, context: ActionContext) => run(input, context, async (raw, site, _can, save) => {
      const { favicon } = z.strictObject({ favicon: z.uuid().nullable() }).parse(raw, { error: z.locales.vi().localeError });
      if (favicon) {
        const media = await deps.media(context.tenantId, favicon);
        if (!media) throw new SiteSettingsError("Không tìm thấy ảnh", 404);
        if (media.status !== "ready" || !["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"].includes(media.mime)) throw new SiteSettingsError("Chọn ảnh PNG, JPEG, WebP, GIF hoặc AVIF đã xử lý xong", 400);
      }
      const profile = z.record(z.string(), z.unknown()).parse(site.profile);
      const brand = z.record(z.string(), z.unknown()).parse(profile.brand ?? {});
      delete brand.favicon;
      return save({ profile: { ...profile, brand: { ...brand, ...(favicon ? { favicon } : {}) } } });
    }),
    colors: (input: SettingsInput, context: ActionContext) => run(input, context, async (raw, site, can, save) => {
      if (!can("themeOverride")) throw new SiteSettingsError("Gói hiện tại không hỗ trợ màu thương hiệu", 403);
      const overrides = brandOverridesSchema.parse(raw, { error: z.locales.vi().localeError }), theme = getTheme(site.themeId);
      if (!theme) throw new SiteSettingsError("Giao diện không tồn tại", 400);
      if (!theme.meta.supportsDark && Object.keys(overrides.colors?.dark ?? {}).length) throw new SiteSettingsError("Giao diện không hỗ trợ chế độ tối", 400);
      const merged = ThemeOverridesSchema.safeParse(site.themeOverrides).data ?? {};
      for (const mode of ["light", "dark"] as const) {
        const colors = { ...merged.colors?.[mode] };
        for (const key of BRAND_COLOR_KEYS) delete colors[key];
        Object.assign(colors, overrides.colors?.[mode]);
        if (Object.keys(colors).length) (merged.colors ??= {})[mode] = colors;
        else if (merged.colors) delete merged.colors[mode];
      }
      if (merged.colors && !Object.keys(merged.colors).length) delete merged.colors;
      assertBrandContrast(theme, merged);
      return save({ themeOverrides: merged });
    }),
    logos: (input: SettingsInput, context: ActionContext) => run(input, context, async (raw, site, _can, save) => {
      const data = z.strictObject({ logo: asset.optional(), logoDark: asset.optional() }).parse(raw, { error: z.locales.vi().localeError });
      const profile = z.record(z.string(), z.unknown()).parse(site.profile);
      const brand = z.record(z.string(), z.unknown()).parse(profile.brand ?? {});
      const { logo: _logo, logoDark: _dark, ...rest } = brand;
      return save({ profile: { ...profile, brand: { ...rest, ...data } } });
    }),
    preview: (input: SettingsInput, context: ActionContext) => run(input, context, async (raw, site, can) => {
      const theme = allowedTheme(raw);
      if (can("themeOverride")) assertOverrides(theme, ThemeOverridesSchema.parse(site.themeOverrides));
      const url = new URL(await deps.preview(context.tenantId, site.id, context.slug));
      url.searchParams.set("theme", theme.meta.id);
      return { ok: true, url: url.toString() };
    }),
  };
}
