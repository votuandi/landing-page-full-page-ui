/** v1 → v2: optional packageSimulation; existing content remains valid without it. */
export function migrateHeroV1(data: Record<string, unknown>) { return { ...data }; }
