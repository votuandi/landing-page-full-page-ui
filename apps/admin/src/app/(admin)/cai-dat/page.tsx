import { companyProfileSchema } from "@solar/db/site-profile";
import { loadSiteSettings } from "../../../lib/siteSettings.ts";
import { siteSettingsDeps } from "../../../lib/siteSettingsRuntime.ts";
import { SiteProfileForm } from "../../../components/SiteProfileForm.tsx";

export default async function CompanySettings() {
  const { site, can, session } = await loadSiteSettings("settings.manage", siteSettingsDeps);
  const profile = companyProfileSchema.safeParse(site.profile);
  const warning = profile.success ? undefined : "Thông tin công ty đã lưu không hợp lệ. Đang hiển thị giá trị mặc định; vui lòng kiểm tra và lưu lại.";
  return <div className="space-y-6">
    <SiteProfileForm initial={profile.success ? profile.data : companyProfileSchema.parse({})} warning={warning} updatedAt={site.updatedAt.toISOString()} initialLocales={site.locales} initialDefaultLocale={site.defaultLocale} bilingual={can("bilingual")} />
    {session.permissions.has("site.backup") && <section aria-labelledby="backup-heading" className="rounded-card border border-line/20 bg-bg-elevated p-6">
      <h2 id="backup-heading" className="text-lg font-semibold text-fg">Sao lưu</h2>
      <p className="mt-2 text-sm text-fg-muted">Tải nội dung website và danh sách media dưới dạng JSON. Liên hệ quản trị nền tảng để khôi phục thành website mới.</p>
      <a href="/api/sao-luu" download className="mt-4 inline-flex min-h-11 items-center rounded-button bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Tải bản sao lưu</a>
    </section>}
  </div>;
}
