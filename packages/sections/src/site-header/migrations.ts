/** v1 → v2: thêm `controls`; dữ liệu cũ giữ nguyên hành vi (không có điều khiển trên header). */
export function migrateSiteHeaderV1(data: Record<string, unknown>) {
  return { ...data, controls: data.controls ?? { language: false, theme: false, cart: false } };
}
