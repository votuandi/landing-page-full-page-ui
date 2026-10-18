import { siteProfileSchema } from "@solar/db/site-profile";
import { ThemeOverridesSchema } from "@solar/tokens";
import { loadSiteSettings } from "../../../lib/siteSettings.ts";
import { siteSettingsDeps } from "../../../lib/siteSettingsRuntime.ts";
import { AppearanceForm } from "../../../components/AppearanceForm.tsx";

export default async function Appearance() {
  const { site, can } = await loadSiteSettings("theme.manage", siteSettingsDeps);
  const profile = siteProfileSchema.parse(site.profile);
  return <AppearanceForm themeId={site.themeId} planId={site.planId} overrides={ThemeOverridesSchema.parse(site.themeOverrides)} logo={profile.brand.logo} logoDark={profile.brand.logoDark} updatedAt={site.updatedAt.toISOString()} canOverride={can("themeOverride")} />;
}
