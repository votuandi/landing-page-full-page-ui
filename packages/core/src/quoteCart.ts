/**
 * Logic GIỎ YÊU CẦU BÁO GIÁ (không có thanh toán) — hàm thuần, không phụ thuộc React, có unit test.
 * Một dòng = một sku + số lượng. Mọi hàm trả về mảng mới (không sửa mảng cũ).
 */
export type CartLine = { sku: string; qty: number };

export const MAX_QTY = 999;

const clampQty = (qty: number) => Math.min(MAX_QTY, Math.max(0, Math.floor(Number.isFinite(qty) ? qty : 0)));

/** Thêm sản phẩm; đã có trong giỏ thì cộng dồn số lượng. */
export function addItem(lines: CartLine[], sku: string, qty = 1): CartLine[] {
  const amount = clampQty(qty);
  if (!sku || amount <= 0) return lines;
  const found = lines.find((l) => l.sku === sku);
  if (!found) return [...lines, { sku, qty: amount }];
  return lines.map((l) => (l.sku === sku ? { ...l, qty: clampQty(l.qty + amount) } : l));
}

/** Đặt số lượng; ≤ 0 thì xóa dòng. */
export function setQty(lines: CartLine[], sku: string, qty: number): CartLine[] {
  const next = clampQty(qty);
  if (next <= 0) return removeItem(lines, sku);
  return lines.map((l) => (l.sku === sku ? { ...l, qty: next } : l));
}

export function removeItem(lines: CartLine[], sku: string): CartLine[] {
  return lines.filter((l) => l.sku !== sku);
}

export function clearCart(): CartLine[] {
  return [];
}

/** Tổng số lượng (hiện trên badge). */
export function countItems(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

/**
 * Làm sạch dữ liệu đọc từ localStorage: bỏ dòng hỏng, gộp sku trùng, bỏ sku không còn trong catalog.
 * `knownSku` để trống = không kiểm tra catalog.
 */
export function sanitizeCart(value: unknown, knownSku?: (sku: string) => boolean): CartLine[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<CartLine[]>((lines, raw) => {
    if (!raw || typeof raw !== "object") return lines;
    const { sku, qty } = raw as { sku?: unknown; qty?: unknown };
    if (typeof sku !== "string" || (knownSku && !knownSku(sku))) return lines;
    return addItem(lines, sku, Number(qty));
  }, []);
}
