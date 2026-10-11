/** v1 → v2: optional simulation evidence, collection items keep their existing format. */
export function migrateProjectsV1(data: Record<string, unknown>) { return { ...data }; }
