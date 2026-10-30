import { z } from "zod";
/**
 * Nguồn lead ghi trong payload (`source`) — biết khách đến từ đâu. Form khác có thể gửi chuỗi riêng
 * (vd. "service-solar-gia-dinh"); chuỗi lạ vẫn được nhận, chỉ không có nhãn tiếng Việt.
 */
export const LEAD_SOURCE_LABELS: Record<string, string> = {
  calculator: "Dự toán chi phí",
  "story-cta": "Video công trình → dự toán",
  "quote-cart": "Giỏ yêu cầu báo giá",
  popup: "Popup tư vấn",
  contact: "Trang liên hệ",
  "home-bottom": "Form cuối trang chủ",
  dealer: "Đăng ký đại lý",
};

export type LeadItem = { sku: string; name: string; qty: number };

export type Lead = {
  name: string;
  phone: string;
  zalo?: string;
  address?: string;
  email?: string;
  message?: string;
  /** Nơi gửi form: "calculator", "story-cta", "quote-cart", "popup", "contact", "home-bottom", "dealer"… */
  source: string;
  segment?: string;
  /** Form đăng ký đại lý */
  province?: string;
  businessType?: string;
  /** Thông số dự toán (calculator, hoặc giỏ báo giá khi khách chọn đính kèm). */
  estimate?: Record<string, string | number | boolean>;
  /** Sản phẩm trong giỏ yêu cầu báo giá. */
  items?: LeadItem[];
  /** Trang gửi form. */
  page?: string;
  submittedAt: string;
  consentAt?: string;
};

const extrasSchema = z.object({
  zalo: z.string().optional(), address: z.string().optional(), province: z.string().optional(), businessType: z.string().optional(),
  estimate: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  items: z.array(z.object({ sku: z.string(), name: z.string(), qty: z.number() })).optional(),
  page: z.string().optional(), submittedAt: z.string().optional(),
});
export type LeadRow = { name?: string | null; phone: string; source: string; segment?: string | null; email?: string | null; message?: string | null; data: unknown; createdAt: Date };
export function leadFromRow(row: LeadRow): Lead {
  const result = extrasSchema.safeParse(row.data), extra = result.success ? result.data : {};
  return { ...extra, name: row.name ?? "", phone: row.phone, source: row.source,
    ...(row.segment ? { segment: row.segment } : {}), ...(row.email ? { email: row.email } : {}), ...(row.message ? { message: row.message } : {}),
    submittedAt: extra.submittedAt ?? row.createdAt.toISOString() };
}

/** Văn bản dễ đọc dùng cho Telegram. */
export function leadToText(lead: Lead) {
  const label = Object.hasOwn(LEAD_SOURCE_LABELS, lead.source) ? LEAD_SOURCE_LABELS[lead.source] : undefined;
  const lines = [
    `🔔 Lead mới — ${label ? `${label} (${lead.source})` : lead.source}`,
    `Họ tên: ${lead.name}`,
    `SĐT: ${lead.phone}`,
    lead.zalo && `Zalo: ${lead.zalo}`,
    lead.email && `Email: ${lead.email}`,
    lead.address && `Địa chỉ: ${lead.address}`,
    lead.segment && `Phân khúc: ${lead.segment}`,
    lead.province && `Tỉnh/thành: ${lead.province}`,
    lead.businessType && `Loại hình kinh doanh: ${lead.businessType}`,
    lead.message && `Ghi chú: ${lead.message}`,
  ];
  if (lead.items?.length) lines.push("— Sản phẩm —", ...lead.items.map((i) => `• ${i.name} × ${i.qty}`));
  if (lead.estimate) lines.push("— Dự toán —", ...Object.entries(lead.estimate).map(([k, v]) => `${k}: ${v}`));
  if (lead.page) lines.push(`Trang: ${lead.page}`);
  lines.push(`Thời gian: ${lead.submittedAt}`);
  return lines.filter(Boolean).join("\n");
}
