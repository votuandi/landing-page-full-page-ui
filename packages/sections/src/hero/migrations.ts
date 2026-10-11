/** v1 → v2: chart là tùy chọn; giữ toàn bộ nội dung và chart đã có của tenant. */
export function migrateHeroV1(data: Record<string, unknown>) {
  return { ...data };
}
