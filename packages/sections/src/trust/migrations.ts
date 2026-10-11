/** v1 → v2: thêm `cardDetails`; dữ liệu cũ giữ thẻ có chi tiết như trước. */
export function migrateTrustV1(data: Record<string, unknown>) {
  return { ...data, cardDetails: data.cardDetails ?? true };
}
