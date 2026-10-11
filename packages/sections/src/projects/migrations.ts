/** v1 → v2: annual metrics and client details are optional; retain existing content. */
export function migrateProjectsV1(data: Record<string, unknown>) {
  return { ...data };
}
