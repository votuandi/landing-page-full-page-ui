import type { Session } from "@solar/auth";
import { getPlan, limit, type EntitlementSubject } from "@solar/plans";
import { authorize } from "./gate.ts";
import { pageTitle } from "./pageSections.ts";

const DAY = 86_400_000;
type PlanSubject = EntitlementSubject & { planExpiresAt: Date | null };
export type LeadWindows = { today: Date; week: Date; stale: Date; now: Date };
type ContentPage = {
  id: string; slug: string; title: unknown; draftSections: unknown;
  sectionContents: { data: unknown; draftData: unknown }[];
};
export type DashboardDeps = {
  tenantId: string;
  leads(windows: LeadWindows): Promise<{ today: number; week: number; stale: number; sources: { source: string }[] }>;
  content(): Promise<ContentPage[]>;
  media(): Promise<{ bytes: number; subject: EntitlementSubject }>;
  domain(): Promise<{ primary: { hostname: string; status: string } | null; fallback: string }>;
  plan(): Promise<PlanSubject>;
  activity(): Promise<{ id: string; action: string; createdAt: Date }[]>;
};

/** Midnight in Vietnam (UTC+7); Vietnam does not observe daylight saving time. */
export function vnDayStart(now: Date): Date {
  return new Date(Math.floor((now.getTime() + 7 * 3_600_000) / DAY) * DAY - 7 * 3_600_000);
}
export function hasSampleMarker(value: unknown): boolean {
  if (typeof value === "string") return value.includes("[DỮ LIỆU MẪU]") || value.includes("[SAMPLE DATA]");
  return value !== null && typeof value === "object" && Object.values(value).some(hasSampleMarker);
}
export function domainLabel(status: string): string {
  switch (status) {
    case "active": return "Đang hoạt động · SSL";
    case "pending": return "Chờ xác minh";
    case "error": return "Lỗi tên miền · cần kiểm tra";
    default: return status;
  }
}
export function planLabel(subject: PlanSubject, now: Date) {
  return {
    name: subject.status === "trial" ? "Dùng thử" : getPlan(subject.planId)?.name ?? subject.planId,
    expiry: subject.planExpiresAt ? `Hết hạn ${subject.planExpiresAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" })}` : "Không thời hạn",
    warning: subject.planExpiresAt !== null && subject.planExpiresAt.getTime() - now.getTime() <= 7 * DAY,
  };
}
const activityLabels: Record<string, string> = {
  "ghost.start": "Truy cập hỗ trợ", "ghost.end": "Kết thúc hỗ trợ",
  "page.publish": "Xuất bản trang", "page.draft": "Lưu bản nháp",
  "site.settings.update": "Cập nhật cài đặt site", "site.import-config": "Nhập cấu hình site",
  "tenant.plan.change": "Thay đổi gói dịch vụ", "plan.upgrade_requested": "Yêu cầu nâng gói",
  "tenant.renewal.reminded": "Nhắc gia hạn gói", "tenant.suspend.expired": "Gói đã hết hạn",
  "staff.invited": "Mời nhân viên", "staff.invite_resent": "Gửi lại lời mời nhân viên",
  "staff.role_changed": "Đổi vai trò nhân viên", "staff.locked": "Khóa nhân viên", "staff.unlocked": "Mở khóa nhân viên",
  "staff.removed": "Gỡ nhân viên", "staff.owner_transferred": "Chuyển chủ sở hữu", "staff.client_converted": "Chuyển loại tài khoản",
  "staff.sessions_revoked": "Đăng xuất thiết bị khác",
};
export function activityLabel(action: string): string { return Object.hasOwn(activityLabels, action) ? activityLabels[action] : action; }

export async function loadDashboard(session: Session, deps: DashboardDeps, now = new Date()) {
  authorize(session, deps.tenantId, "dashboard.view");
  const today = vnDayStart(now);
  const windows = { today, week: new Date(today.getTime() - 6 * DAY), stale: new Date(now.getTime() - DAY), now };
  const [leads, content, media, domain, plan, activity] = await Promise.all([
    session.permissions.has("leads.view") ? deps.leads(windows).then(rows => {
      const counts = new Map<string, number>();
      for (const { source } of rows.sources) counts.set(source, (counts.get(source) ?? 0) + 1);
      return { ...rows, sources: [...counts].map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source, "vi")) };
    }) : undefined,
    session.permissions.has("pages.view") ? deps.content().then(pages => {
      const summary = (page: ContentPage) => ({ id: page.id, title: pageTitle(page.title, page.slug), href: `/trang/${page.id}` });
      const samples = pages.flatMap(page => {
        const sectionCount = page.sectionContents.filter(section => hasSampleMarker(section.data) || hasSampleMarker(section.draftData)).length;
        return sectionCount ? [{ ...summary(page), sectionCount }] : [];
      });
      const drafts = pages.filter(page => page.draftSections != null || page.sectionContents.some(section => section.draftData != null)).map(summary);
      return { samples, drafts };
    }) : undefined,
    session.permissions.has("media.view") ? deps.media().then(({ bytes, subject }) => {
      const usedGb = bytes / 1024 ** 3;
      const limitGb = limit(subject, "mediaGb", { now });
      const percent = limitGb > 0 ? usedGb / limitGb * 100 : bytes > 0 ? 100 : 0;
      const format = (value: number) => value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
      return { bytes, limitGb, percent, label: `${format(usedGb)} / ${format(limitGb)} GB`, warning: bytes > limitGb * 1024 ** 3 || percent > 90 };
    }) : undefined,
    session.permissions.has("domains.manage") ? deps.domain().then(({ primary, fallback }) => ({
      hostname: primary?.hostname ?? fallback, label: primary ? domainLabel(primary.status) : "Tên miền nền tảng", warning: primary?.status === "error",
    })) : undefined,
    session.permissions.has("billing.view") ? deps.plan().then(subject => planLabel(subject, now)) : undefined,
    session.permissions.has("audit.view") ? deps.activity().then(rows => [...rows]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))
      .slice(0, 10).map(row => ({ ...row, label: activityLabel(row.action) }))) : undefined,
  ]);
  return { leads, content, media, domain, plan, activity };
}
