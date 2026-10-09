/**
 * Quy tắc hiển thị giá (dùng chung cho gói giải pháp và sản phẩm):
 *  - salePrice CHỈ hiển thị khi salePrice < price; khi đó price được gạch ngang.
 *  - Nhãn "Giảm Y%" chỉ hiện khi Y ≥ MIN_BADGE_DISCOUNT (5%) — không gắn nhãn giảm giá tràn lan.
 *  - Không có price → hiện "Liên hệ".
 */
export const MIN_BADGE_DISCOUNT = 5;

export function resolvePrice(price?: number, salePrice?: number) {
  if (!price) return { current: undefined, original: undefined };
  if (typeof salePrice === "number" && salePrice > 0 && salePrice < price) return { current: salePrice, original: price };
  return { current: price, original: undefined };
}

/** % giảm (làm tròn) khi salePrice hợp lệ, ngược lại 0. */
export function discountPercent(price?: number, salePrice?: number) {
  const { current, original } = resolvePrice(price, salePrice);
  return original && current ? Math.round((1 - current / original) * 100) : 0;
}

export type PriceView =
  | { kind: "contact" }
  | { kind: "price"; current: number; original?: number; badge?: number };

export function priceView(price?: number, salePrice?: number): PriceView {
  const { current, original } = resolvePrice(price, salePrice);
  if (!current) return { kind: "contact" };
  const percent = discountPercent(price, salePrice);
  return { kind: "price", current, original, badge: percent >= MIN_BADGE_DISCOUNT ? percent : undefined };
}
