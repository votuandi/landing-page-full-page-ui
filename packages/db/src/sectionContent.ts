import { migrateSectionData, sectionRegistry } from "@solar/sections";

type SectionRow = { type: string; schemaVersion: number; data: unknown; draftData?: unknown };

/** Read lazily; callers persist the upgraded pair together when saving. */
export function migrateSectionRow<T extends SectionRow>(row: T) {
  const def = sectionRegistry.getType(row.type);
  if (!def) throw new Error(`[sections] unknown section type ${row.type}`);
  const published = migrateSectionData(def, row.schemaVersion, row.data);
  const draft = row.draftData == null ? null : migrateSectionData(def, row.schemaVersion, row.draftData);
  return {
    ...row, schemaVersion: published.schemaVersion, data: published.data,
    draftData: draft ? draft.data : row.draftData, changed: published.changed || (draft?.changed ?? false),
  };
}
