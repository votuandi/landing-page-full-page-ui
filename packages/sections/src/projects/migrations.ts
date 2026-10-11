/** v1 → v2: trường tùy chọn — số liệu năm/khách hàng (E4-S04, projects/t14) và `evidence` mô phỏng gói (E4-S05, projects/t11); giữ nguyên nội dung. */
export function migrateProjectsV1(data: Record<string, unknown>) {
  return { ...data };
}
