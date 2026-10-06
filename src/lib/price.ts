/**
 * Quy tắc giá: salePrice CHỈ hiển thị khi salePrice < price.
 * Trả về giá đang bán và (nếu có giảm) giá gốc để gạch ngang.
 */
export function resolvePrice(price?: number, salePrice?: number) {
  if (!price) return { current: undefined, original: undefined };
  if (typeof salePrice === "number" && salePrice > 0 && salePrice < price) return { current: salePrice, original: price };
  return { current: price, original: undefined };
}
