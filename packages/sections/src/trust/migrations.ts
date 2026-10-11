/** v1 → v2: logo là tùy chọn; giữ nguyên ảnh chứng chỉ và toàn bộ dữ liệu khách đã nhập. */
export function migrateTrustV1(data: Record<string, unknown>) {
  return { ...data };
}
