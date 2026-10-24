import { z } from "zod";
import { pageTag, siteTag } from "@solar/cache";
import { collectRefs, migrateSectionData, pageConfigSchema, sectionRegistry } from "@solar/sections";
import { validateSiteStructure, siteStructureOf } from "@solar/presets";
import { canUse, limit } from "@solar/plans";
import { Prisma } from "../generated/client.ts";
import { loadDisabledFeatures, type Db, type PlatformDb } from "./client.ts";
import { withTenantTransaction } from "./tenantTransaction.ts";
import type { TenantRepo } from "./repository.ts";
import { enqueueInvalidate } from "./invalidate.ts";
import { publishMedia } from "./media.ts";

const actorSchema = z.strictObject({ siteUserId: z.uuid().optional(), platformAdminId: z.uuid().optional() })
  .refine(actor => Number(!!actor.siteUserId) + Number(!!actor.platformAdminId) === 1, "Exactly one publisher is required");
const baseSchema = z.strictObject({ pageId: z.uuid(), expectedRevision: z.number().int().min(0), actor: actorSchema });
const draftSchema = baseSchema.extend({ draftSections: z.array(z.unknown()).optional(), sections: z.array(z.strictObject({
  sectionId: z.string().min(1), type: z.string().min(1), draftData: z.unknown(),
})).optional() });
export type PublishInput = z.input<typeof baseSchema>;
export type DraftInput = z.input<typeof draftSchema>;

export class RevisionConflictError extends Error {
  constructor(readonly currentRevision: number | null) {
    super("Trang đã thay đổi. Tải lại trước khi lưu.");
    this.name = "RevisionConflictError";
  }
}
export class StructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StructureError";
  }
}
const descriptors = (value: unknown) => pageConfigSchema.parse({ sections: Array.isArray(value)
  ? value.map(section => ({ ...section, data: undefined })) : value }).sections.map(({ data: _data, ...section }) => section);

async function lockPage(repo: TenantRepo, input: PublishInput) {
  const result = await repo.page.update(input.pageId, { revision: { increment: 1 } }, { revision: input.expectedRevision });
  if (!result.count) throw new RevisionConflictError((await repo.page.get(input.pageId))?.revision ?? null);
  return (await repo.page.get(input.pageId))!;
}

async function markRemoved(repo: TenantRepo, pageId: string) {
  const page = (await repo.page.get(pageId))!;
  const ids = new Set([...descriptors(page.sections), ...descriptors(page.draftSections ?? page.sections)].map(s => s.id));
  for (const row of await repo.sectionContent.list({ where: { pageId } })) {
    if (ids.has(row.sectionId)) {
      if (row.removedAt) await repo.sectionContent.update(row.id, { removedAt: null });
    } else if (!row.removedAt) await repo.sectionContent.update(row.id, { removedAt: new Date() });
  }
}

async function checkStructure(repo: TenantRepo, siteId: string, pageId: string, sections: unknown, disabled: string[]) {
  const site = await repo.site.first({ where: { id: siteId }, include: { tenant: true } });
  if (!site) throw new Error("Site not found");
  const rows = await repo.page.list({ where: { siteId } });
  const baseline = siteStructureOf(site, rows.map(row => ({ slug: row.slug, sections: descriptors(row.sections) })));
  const proposed = siteStructureOf(site, rows.map(row => ({ slug: row.slug,
    sections: descriptors(row.id === pageId ? sections : row.sections) })));
  const errors = validateSiteStructure(proposed, { can: canUse(site.tenant, { disabled }), pagesLimit: limit(site.tenant, "pages"), baseline });
  if (errors.length) throw new StructureError(errors.join("; "));
  for (const section of proposed.pages.flatMap(page => page.sections)) {
    if (!sectionRegistry.variantsOf(section.type)?.includes(section.variant)) throw new Error(`Unknown section variant: ${section.type}/${section.variant}`);
  }
}

/** Callers authenticate/authorize the actor. All page writers must use the same revision lock. */
export async function saveDraft(db: Db | PlatformDb, tenantId: string, raw: DraftInput) {
  const input = draftSchema.parse(raw);
  const disabled = await loadDisabledFeatures(db);
  return withTenantTransaction(db, tenantId, async repo => {
    const page = await lockPage(repo, input);
    if (input.draftSections !== undefined) {
      const sections = descriptors(input.draftSections);
      await checkStructure(repo, page.siteId, page.id, sections, disabled);
      await repo.page.update(page.id, { draftSections: sections });
    }
    for (const section of input.sections ?? []) {
      const def = sectionRegistry.getType(section.type);
      if (!def) throw new Error(`Unknown section type: ${section.type}`);
      const draftData = def.schema.parse(section.draftData) as Prisma.InputJsonValue;
      const existing = await repo.sectionContent.first({ where: { siteId: page.siteId, pageId: page.id, sectionId: section.sectionId } });
      if (existing) {
        if (existing.type !== section.type) throw new Error("Section type is immutable");
        await repo.sectionContent.update(existing.id, { draftData, revision: { increment: 1 } });
      } else await repo.sectionContent.create({ siteId: page.siteId, pageId: page.id, sectionId: section.sectionId,
        type: section.type, data: def.defaults as Prisma.InputJsonValue, draftData });
    }
    await markRemoved(repo, page.id);
    return { revision: page.revision };
  });
}

export async function publishPage(db: Db | PlatformDb, tenantId: string, raw: PublishInput) {
  const input = baseSchema.parse(raw);
  const disabled = await loadDisabledFeatures(db);
  return withTenantTransaction(db, tenantId, async repo => {
    const page = await lockPage(repo, input);
    const sections = descriptors(page.draftSections ?? page.sections);
    await checkStructure(repo, page.siteId, page.id, sections, disabled);
    const contents = [];
    for (const content of await repo.sectionContent.list({ where: { siteId: page.siteId, pageId: page.id }, orderBy: { sectionId: "asc" } })) {
      if (!sections.some(s => s.id === content.sectionId)) continue;
      const def = sectionRegistry.getType(content.type);
      if (!def) throw new Error(`Unknown section type: ${content.type}`);
      if (content.draftData !== null) await repo.sectionContent.update(content.id, {
        data: def.schema.parse(migrateSectionData(def, content.schemaVersion, content.draftData).data) as Prisma.InputJsonValue,
        draftData: Prisma.DbNull, revision: { increment: 1 },
      });
      const saved = (await repo.sectionContent.get(content.id))!;
      await publishMedia(repo, collectRefs(def.schema, saved.data).media);
      contents.push({ sectionId: saved.sectionId, type: saved.type, schemaVersion: saved.schemaVersion, data: saved.data });
    }
    await repo.page.update(page.id, { sections, draftSections: Prisma.DbNull, publishedAt: new Date() });
    await markRemoved(repo, page.id);
    const version = await repo.pageVersion.create({ pageId: page.id, revision: page.revision, snapshot: { sections, contents },
      publishedBySiteUserId: input.actor.siteUserId, publishedByPlatformAdminId: input.actor.platformAdminId });
    await enqueueInvalidate(repo, [pageTag(tenantId, page.slug), ...(page.kind === "home" || !page.publishedAt ? [siteTag(tenantId)] : [])]);
    return { revision: page.revision, versionId: version.id };
  });
}
