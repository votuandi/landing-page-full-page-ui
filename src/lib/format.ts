/** Định dạng số/tiền kiểu Việt Nam. Không phụ thuộc React — dùng được trong unit test. */

/** 1000000 → "1.000.000" */
export const formatNumber = (value: number, decimals = 0) =>
  new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(decimals ? value : Math.round(value));

/** Chuỗi nhập "1.000.000" / "1,000,000" / "1000000" → 1000000 */
export const parseNumber = (text: string) => Number(text.replace(/[^\d]/g, "")) || 0;

/** 1.234.000.000 → "1,23 tỷ"; 3.450.000 → "3,5 triệu"; 930.710 → "931 nghìn" */
export function formatMoneyShort(value: number) {
  const fmt = (n: number, digits: number) => n.toFixed(digits).replace(/\.?0+$/, "").replace(".", ",");
  if (value >= 1e9) return `${fmt(value / 1e9, 2)} tỷ`;
  if (value >= 1e6) return `${fmt(value / 1e6, value >= 1e8 ? 0 : 1)} triệu`;
  if (value >= 1e3) return `${formatNumber(value / 1e3)} nghìn`;
  return `${formatNumber(value)} đ`;
}

/** 3450000 → "3.450.000 ₫" */
export const formatVnd = (value: number) => `${formatNumber(value)} ₫`;
