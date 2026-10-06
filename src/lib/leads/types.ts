/** Nguồn lead ghi trong payload — biết khách đến từ đâu. */
export const LEAD_SOURCES = ["calculator", "quote-cart", "popup", "story-cta", "contact"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export type LeadItem = { sku: string; name: string; qty: number };

export type Lead = {
  name: string;
  phone: string;
  zalo?: string;
  address?: string;
  message?: string;
  source: LeadSource;
  segment?: string;
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

const SOURCE_LABELS: Record<LeadSource, string> = {
  calculator: "Dự toán chi phí",
  "quote-cart": "Giỏ yêu cầu báo giá",
  popup: "Popup tư vấn",
  "story-cta": "Video công trình → dự toán",
  contact: "Trang liên hệ",
};

/** Văn bản dễ đọc dùng cho Telegram. */
export function leadToText(lead: Lead) {
  const lines = [
    `🔔 Lead mới — ${SOURCE_LABELS[lead.source]} (${lead.source})`,
    `Họ tên: ${lead.name}`,
    `SĐT: ${lead.phone}`,
    lead.zalo && `Zalo: ${lead.zalo}`,
    lead.address && `Địa chỉ: ${lead.address}`,
    lead.segment && `Phân khúc: ${lead.segment}`,
    lead.message && `Ghi chú: ${lead.message}`,
  ];
  if (lead.items?.length) lines.push("— Sản phẩm —", ...lead.items.map((i) => `• ${i.name} × ${i.qty}`));
  if (lead.estimate) lines.push("— Dự toán —", ...Object.entries(lead.estimate).map(([k, v]) => `${k}: ${v}`));
  if (lead.page) lines.push(`Trang: ${lead.page}`);
  lines.push(`Thời gian: ${lead.submittedAt}`);
  return lines.filter(Boolean).join("\n");
}
