/** v1 → v2: no total is inferred from formatted channel counts. */
export function migrateSocialV1(data: Record<string, unknown>) {
  return { ...data };
}
