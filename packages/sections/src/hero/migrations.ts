/** v1 → v2: trường tùy chọn `packageSimulation` (E4-S05) và `highlights`/`note`/`segmentViews` (E4-S06); nội dung cũ vẫn hợp lệ. */
export function migrateHeroV1(data: Record<string, unknown>) { return { ...data }; }
