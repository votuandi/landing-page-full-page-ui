export type Lead = {
  name: string;
  phone: string;
  zalo?: string;
  address?: string;
  email?: string;
  message?: string;
  /** Nơi gửi form: "calculator", "home-bottom", "contact", "rfq"… */
  source: string;
  segment?: string;
  /** Toàn bộ thông số dự toán (nếu gửi từ công cụ dự toán). */
  estimate?: Record<string, string | number | boolean>;
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
  const lines = [
    `🔔 Lead mới (${lead.source})`,
    `Họ tên: ${lead.name}`,
    `SĐT: ${lead.phone}`,
    lead.zalo && `Zalo: ${lead.zalo}`,
    lead.email && `Email: ${lead.email}`,
    lead.address && `Địa chỉ: ${lead.address}`,
    lead.segment && `Phân khúc: ${lead.segment}`,
    lead.message && `Ghi chú: ${lead.message}`,
  ];
  if (lead.estimate) lines.push("— Dự toán —", ...Object.entries(lead.estimate).map(([k, v]) => `${k}: ${v}`));
  lines.push(`Thời gian: ${lead.submittedAt}`);
  return lines.filter(Boolean).join("\n");
}
