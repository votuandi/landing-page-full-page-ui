/** v1 → v2: optional lookup URLs/legal items; keep customized certificate fields. */
export function migrateTrustV1(data: Record<string, unknown>) { return { ...data }; }
