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
};

export type LeadAdapter = {
  name: string;
  /** Adapter chỉ chạy khi đủ biến môi trường. */
  enabled: () => boolean;
  send: (lead: Lead) => Promise<void>;
};

/** Văn bản dễ đọc dùng cho Telegram. */
export function leadToText(lead: Lead) {
  const label = LEAD_SOURCE_LABELS[lead.source];
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
