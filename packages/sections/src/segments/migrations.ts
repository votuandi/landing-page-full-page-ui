/** v1 → v2: trường tùy chọn `solarProfile`/`comparison` (E4-S05) và `intro`/`tag`/`benefits`/`ctaLabel`/`detailLink` (E4-S06); giữ mọi item cũ. */
export function migrateSegmentsV1(data: Record<string, unknown>) { return { ...data }; }
