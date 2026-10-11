/** v1 → v2: thêm `logo` tùy chọn (E4-S03) và `cardDetails` (E4-S01); dữ liệu cũ giữ thẻ có chi tiết như trước. */
export function migrateTrustV1(data: Record<string, unknown>) {
  return { ...data, cardDetails: data.cardDetails ?? true };
}
