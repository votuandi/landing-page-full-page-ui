import { collectRefs, sectionRegistry } from "@solar/sections";
import { collectionMediaIds } from "./collectionWrite.ts";
import { COLLECTIONS } from "./collections.ts";
import { mediaReferences } from "./mediaLibrary.ts";
import { siteProfileMediaIds } from "./siteProfile.ts";
import type { TenantRepo } from "./repository.ts";
import type { TenantBackup } from "./tenantBackup.ts";

type Section = { type: string; data: unknown; draftData?: unknown };
function sectionIds(row: Section): string[] {
  const def = sectionRegistry.getType(row.type);
  if (!def) throw new Error(`Không thể quét tham chiếu media: section ${row.type} không hợp lệ`);
  return [row.data, row.draftData].flatMap(value => collectRefs(def.schema, value).media);
}
export function descriptorMediaIds(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error("Không thể quét tham chiếu media: sections không hợp lệ");
  return value.flatMap(row => row && typeof row === "object" && "data" in row ? sectionIds(row as Section) : []);
}
export function snapshotMediaIds(value: unknown): string[] {
  if (!value || typeof value !== "object") throw new Error("Không thể quét tham chiếu media: snapshot không hợp lệ");
  const contents = "contents" in value ? value.contents : [];
  if (!Array.isArray(contents)) throw new Error("Không thể quét tham chiếu media: snapshot không hợp lệ");
  return [...contents.flatMap(row => row && typeof row === "object" && ("data" in row || "draftData" in row) ? sectionIds(row as Section) : []),
    ...("sections" in value ? descriptorMediaIds(value.sections) : [])];
}

/** Retention also protects history and legacy inline descriptors; the editor's usage list stays unchanged. */
export async function mediaReferenceIds(repo: TenantRepo): Promise<Set<string>> {
  const [live, pages, versions] = await Promise.all([mediaReferences(repo), repo.page.list(), repo.pageVersion.list()]);
  return new Set([...live.keys(), ...pages.flatMap(page => [...descriptorMediaIds(page.sections), ...descriptorMediaIds(page.draftSections)]),
    ...versions.flatMap(version => snapshotMediaIds(version.snapshot))].map(id => id.toLowerCase()));
}

/** The media inventory itself is not a reference: old backups contain unused media too. */
export function backupMediaReferenceIds(bundle: TenantBackup): Set<string> {
  return new Set([
    ...siteProfileMediaIds(bundle.site.profile), ...bundle.sectionContents.flatMap(sectionIds),
    ...bundle.pages.flatMap(page => [...descriptorMediaIds(page.sections), ...descriptorMediaIds(page.draftSections)]),
    ...bundle.pageVersions.flatMap(version => snapshotMediaIds(version.snapshot)),
    ...COLLECTIONS.flatMap(name => bundle.collections[name].flatMap(row => collectionMediaIds(name, row))),
  ].map(id => id.toLowerCase()));
}
