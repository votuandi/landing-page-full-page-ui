/** v1 → v2: the optional quote checklist leaves existing banners unchanged. */
export function migrateCtaBannerV1(data: Record<string, unknown>) {
  return { ...data };
}
