import { companyProfileSchema } from "@solar/db/site-profile";
import { loadSiteSettings } from "../../../lib/siteSettings.ts";
import { siteSettingsDeps } from "../../../lib/siteSettingsRuntime.ts";
import { SiteProfileForm } from "../../../components/SiteProfileForm.tsx";

export default async function CompanySettings() {
  const { site, can } = await loadSiteSettings("settings.manage", siteSettingsDeps);
  const profile = companyProfileSchema.safeParse(site.profile);
  const warning = profile.success ? undefined : "Thông tin công ty đã lưu không hợp lệ. Đang hiển thị giá trị mặc định; vui lòng kiểm tra và lưu lại.";
  return <SiteProfileForm initial={profile.success ? profile.data : companyProfileSchema.parse({})} warning={warning} updatedAt={site.updatedAt.toISOString()} initialLocales={site.locales} initialDefaultLocale={site.defaultLocale} bilingual={can("bilingual")} />;
}
