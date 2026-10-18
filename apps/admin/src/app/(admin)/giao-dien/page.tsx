import { siteProfileSchema } from "@solar/db/site-profile";
import { ThemeOverridesSchema } from "@solar/tokens";
import { loadSiteSettings } from "../../../lib/siteSettings.ts";
import { siteSettingsDeps } from "../../../lib/siteSettingsRuntime.ts";
import { AppearanceForm } from "../../../components/AppearanceForm.tsx";

export default async function Appearance() {
  const { site, can } = await loadSiteSettings("theme.manage", siteSettingsDeps);
  const parsedProfile = siteProfileSchema.safeParse(site.profile), overrides = ThemeOverridesSchema.safeParse(site.themeOverrides);
  const profile = parsedProfile.success ? parsedProfile.data : siteProfileSchema.parse({});
  const warning = [
    !parsedProfile.success && "Thông tin công ty đã lưu không hợp lệ. Đang hiển thị logo mặc định; vui lòng kiểm tra và lưu lại trong Thông tin công ty.",
    !overrides.success && "Màu tùy chỉnh đã lưu không hợp lệ. Đang hiển thị màu mặc định; vui lòng kiểm tra và lưu lại.",
  ].filter(Boolean).join(" ") || undefined;
  return <AppearanceForm themeId={site.themeId} planId={site.planId} overrides={overrides.success ? overrides.data : ThemeOverridesSchema.parse({})} logo={profile.brand.logo} logoDark={profile.brand.logoDark} warning={warning} updatedAt={site.updatedAt.toISOString()} canOverride={can("themeOverride")} />;
}
