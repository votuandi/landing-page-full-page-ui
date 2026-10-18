import { companyProfileSchema } from "@solar/db/site-profile";
import { loadSiteSettings } from "../../../lib/siteSettings.ts";
import { siteSettingsDeps } from "../../../lib/siteSettingsRuntime.ts";
import { SiteProfileForm } from "../../../components/SiteProfileForm.tsx";

export default async function CompanySettings() {
  const { site, can } = await loadSiteSettings("settings.manage", siteSettingsDeps);
  return <SiteProfileForm initial={companyProfileSchema.parse(site.profile)} updatedAt={site.updatedAt.toISOString()} initialLocales={site.locales} initialDefaultLocale={site.defaultLocale} bilingual={can("bilingual")} />;
}
