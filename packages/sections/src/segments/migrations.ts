/** v1 → v2: optional daily profiles/comparison; preserve all previous items. */
export function migrateSegmentsV1(data: Record<string, unknown>) { return { ...data }; }
