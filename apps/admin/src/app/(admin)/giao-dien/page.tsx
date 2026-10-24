import { siteProfileSchema } from "@solar/db/site-profile";
import { ThemeOverridesSchema } from "@solar/tokens";
import { getTheme, themes } from "@solar/themes";
import { themeAllowed } from "@solar/plans";
import { loadSiteSettings } from "../../../lib/siteSettings.ts";
import { siteSettingsDeps } from "../../../lib/siteSettingsRuntime.ts";
import { AppearanceForm } from "../../../components/AppearanceForm.tsx";
import { appearanceDeps } from "../../../lib/appearanceRuntime.ts";

export default async function Appearance() {
  const { site, can } = await loadSiteSettings("theme.manage", siteSettingsDeps);
  const parsedProfile = siteProfileSchema.safeParse(site.profile), overrides = ThemeOverridesSchema.safeParse(site.themeOverrides);
  const profile = parsedProfile.success ? parsedProfile.data : siteProfileSchema.parse({});
  const { tenantId } = await appearanceDeps.tenant();
  const images = await appearanceDeps.images(tenantId);
  if (profile.brand.favicon && !images.some(image => image.id === profile.brand.favicon)) {
    const current = await appearanceDeps.media(tenantId, profile.brand.favicon);
    if (current?.status === "ready" && current.mime.startsWith("image/")) images.unshift(current);
  }
  const storedTheme = getTheme(site.themeId), fallback = themes.find(theme => themeAllowed(site.planId, theme.meta.group));
  const warning = [
    storedTheme && !themeAllowed(site.planId, storedTheme.meta.group) && `Theme ${storedTheme.meta.name} ngoài gói, website đang dùng ${fallback?.meta.name ?? "theme mặc định"}. Nội dung và cấu hình theme đã lưu được giữ nguyên.`,
    !parsedProfile.success && "Thông tin công ty đã lưu không hợp lệ. Đang hiển thị logo mặc định; vui lòng kiểm tra và lưu lại trong Thông tin công ty.",
    !overrides.success && "Màu tùy chỉnh đã lưu không hợp lệ. Đang hiển thị màu mặc định; vui lòng kiểm tra và lưu lại.",
  ].filter(Boolean).join(" ") || undefined;
  return <AppearanceForm themeId={site.themeId} planId={site.planId} overrides={overrides.success ? overrides.data : ThemeOverridesSchema.parse({})} logo={profile.brand.logo} logoDark={profile.brand.logoDark} favicon={profile.brand.favicon} images={images.map(image => ({ id: image.id, alt: typeof image.alt === "string" ? image.alt : image.alt && typeof image.alt === "object" && !Array.isArray(image.alt) && typeof image.alt.vi === "string" ? image.alt.vi : image.id, mime: image.mime }))} warning={warning} updatedAt={site.updatedAt.toISOString()} canOverride={can("themeOverride")} />;
}
