import { sectionRegistry, type SectionRegistry } from "./registry";

/** Tính cả section tắt để bật lại không vượt giới hạn. */
export function sectionLimitIssues(sections: readonly { type: string }[], registry: Pick<SectionRegistry, "getType"> = sectionRegistry): string[] {
  const counts = new Map<string, number>();
  for (const { type } of sections) counts.set(type, (counts.get(type) ?? 0) + 1);
  return [...counts].flatMap(([type, count]) => {
    const meta = registry.getType(type)?.meta;
    return meta?.maxPerPage !== undefined && count > meta.maxPerPage
      ? [`Chỉ được có tối đa ${meta.maxPerPage} "${meta.label.vi}" trên một trang`] : [];
  });
}
