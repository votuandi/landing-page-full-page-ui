"use client";
import { useState, useSyncExternalStore, useTransition } from "react";
import { SchemaForm, describe, type FieldNode } from "@solar/cms-ui";
import { companyProfileSchema } from "@solar/db/site-profile";
import { saveSiteProfile } from "../app/(admin)/cai-dat/actions.ts";
import type { ActionResult } from "../lib/action.ts";
import { CompanyFilterQuery } from "./CompanyFilterQuery.tsx";

const words: Record<string, string> = {
  name: "Tên công ty", description: "Giới thiệu", email: "Email", hotline: "Hotline", brand: "Thương hiệu", legalName: "Tên pháp lý", tagline: "Khẩu hiệu", logo: "Logo sáng", logoDark: "Logo tối", logoText: "Chữ viết tắt", foundedYear: "Năm thành lập", url: "Đường dẫn HTTPS", legal: "Pháp lý", businessRegistration: "Đăng ký kinh doanh", number: "Số đăng ký", issuedBy: "Nơi cấp", issuedDate: "Ngày cấp", licenses: "Giấy phép", iso: "Chứng nhận ISO", moitBadge: "Xác nhận Bộ Công Thương", enabled: "Bật", zalo: "Liên hệ Zalo", household: "Hộ gia đình", factory: "Nhà xưởng", project: "Dự án", label: "Nhãn", phone: "Số điện thoại", messenger: "Đường dẫn Messenger", complaintHotline: "Hotline khiếu nại", workingHours: "Giờ làm việc", callbackHours: "Gọi lại trong (giờ)", socials: "Mạng xã hội", id: "Kênh / mã", handle: "Tên tài khoản", followers: "Người theo dõi", stats: "Số liệu", mwp: "Tổng công suất (MWp)", projects: "Số dự án", dealers: "Đại lý", provinces: "Tỉnh thành", engineers: "Kỹ sư", customers: "Khách hàng", reviews: "Đánh giá bên ngoài", google: "Google", trustpilot: "Trustpilot", rating: "Điểm đánh giá", count: "Số đánh giá", commitments: "Cam kết dịch vụ", title: "Tiêu đề", desc: "Mô tả", popup: "Popup tư vấn", delayMs: "Thời gian chờ (ms)", scrollRatio: "Tỷ lệ cuộn (0–1)", topBar: "Thanh thông báo", items: "Nội dung", megaMenu: "Menu mở rộng", pricing: "Bảng giá", equipment: "Thiết bị", categories: "Nhóm giá", hint: "Gợi ý", segment: "Phân khúc", groups: "Nhóm", chips: "Lựa chọn", bill: "Tiền điện tháng (đồng)", popular: "Phổ biến", category: "Danh mục", filters: "Bộ lọc", query: "Tham số lọc",
};
const labels: Record<string, string> = {};
function labelFields(node: FieldNode, path = "") {
  if (node.kind === "object") for (const field of node.fields) { const key = path ? `${path}.${field.key}` : field.key; labels[key] = words[field.key] ?? field.key; labelFields(field.node, key); }
  if (node.kind === "array") labelFields(node.item, `${path}.*`);
  if (node.kind === "union") for (const option of node.options) labelFields(option.node, path);
}
labelFields(describe(companyProfileSchema));
const widgets = { "megaMenu.equipment.groups.*.filters.*.query": CompanyFilterQuery };
const subscribeNothing = () => () => {};

export function SiteProfileForm({ initial, updatedAt, initialLocales, initialDefaultLocale, bilingual }: {
  initial: ReturnType<typeof companyProfileSchema.parse>; updatedAt: string; initialLocales: string[]; initialDefaultLocale: string; bilingual: boolean;
}) {
  const [value, setValue] = useState<unknown>(initial), [locales, setLocales] = useState(initialLocales);
  const [defaultLocale, setDefaultLocale] = useState(initialDefaultLocale), [version, setVersion] = useState(updatedAt);
  const [result, setResult] = useState<ActionResult>({}), [pending, start] = useTransition();
  // Keep SSR values readable, and accept edits only after their React handlers are attached.
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);
  return <div className="min-w-0 space-y-6 [&_button]:min-h-11 [&_button]:min-w-11">
    <h1>Thông tin công ty</h1>
    <p className="text-sm text-fg-muted">Thông tin được lưu và áp dụng ngay. Quản lý chi nhánh trong mục Nội dung.</p>
    <div role="status" aria-live="polite" className={result.error ? "break-words text-danger" : "text-fg"}>{result.error ?? result.message}</div>
    <fieldset disabled={!ready || pending} className="min-w-0 space-y-4" aria-busy={!ready || pending}>
      <legend className="mb-3 text-lg font-semibold">Ngôn ngữ</legend>
      <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked disabled />Tiếng Việt (bắt buộc)</label>
      {bilingual && <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={locales.includes("en")} onChange={event => { setLocales(event.target.checked ? ["vi", "en"] : ["vi"]); if (!event.target.checked) setDefaultLocale("vi"); }} />Tiếng Anh</label>}
      <label className="block space-y-2"><span>Ngôn ngữ mặc định</span><select className="min-h-11 w-full rounded-input border border-line/20 bg-bg px-3 text-fg" value={defaultLocale} onChange={event => setDefaultLocale(event.target.value)} disabled={!bilingual}>
        {(bilingual ? locales : [defaultLocale]).map(locale => <option key={locale} value={locale}>{locale === "vi" ? "Tiếng Việt" : "Tiếng Anh"}</option>)}
      </select></label>
      {!bilingual && <p className="text-sm text-fg-muted">Song ngữ có trong gói Cao cấp.</p>}
    </fieldset>
    <fieldset disabled={!ready || pending} aria-busy={!ready || pending} className="min-w-0"><legend className="sr-only">Hồ sơ công ty</legend>
      <SchemaForm schema={companyProfileSchema} value={value as never} onChange={next => { setValue(next); setResult({}); }} labels={labels} widgets={widgets} bilingual={bilingual}
        submitLabel={pending ? "Đang lưu…" : "Lưu thông tin công ty"} onSubmit={profile => start(async () => {
          const form = new FormData(); form.set("updatedAt", version); form.set("payload", JSON.stringify({ profile, locales, defaultLocale }));
          try { const response = await saveSiteProfile({}, form); setResult(response); if (response.updatedAt) setVersion(response.updatedAt); }
          catch { setResult({ error: "Không thể kết nối. Vui lòng thử lại." }); }
        })} />
    </fieldset>
  </div>;
}
