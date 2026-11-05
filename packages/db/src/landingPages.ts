import { randomUUID } from "node:crypto";
import { z } from "zod";
import { pageTag, siteTag } from "@solar/cache";
import { canUse, limit } from "@solar/plans";
import { getPreset, isLandingSlug, landingSlugIssue, PAGE_TEMPLATES, pageSettingsSchema, siteStructureOf, validateSiteStructure, type PageTemplateId } from "@solar/presets";
import { pageConfigSchema, sectionRegistry } from "@solar/sections";
import type { Prisma } from "../generated/client.ts";
import { loadDisabledFeatures, type Db, type PlatformDb } from "./client.ts";
import { withTenantTransaction } from "./tenantTransaction.ts";
import { StructureError } from "./publish.ts";
import { SiteSettingsError } from "./siteSettings.ts";
import { enqueueInvalidate } from "./invalidate.ts";

const titleSchema = z.strictObject({ vi: z.string().trim().min(1).max(200), en: z.string().trim().max(200).optional() });
const createSchema = z.strictObject({
  siteId: z.uuid(), title: titleSchema, slug: z.string().superRefine((slug, ctx) => {
    const message = landingSlugIssue(slug);
    if (message) ctx.addIssue({ code: "custom", message });
  }),
  source: z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("blank") }),
    z.strictObject({ kind: z.literal("template"), id: z.enum(Object.keys(PAGE_TEMPLATES) as [PageTemplateId, ...PageTemplateId[]]) }),
    z.strictObject({ kind: z.literal("duplicate"), pageId: z.uuid() }),
  ]),
});
const settingsSchema = z.strictObject({ pageId: z.uuid(), title: titleSchema, settings: pageSettingsSchema });
export type CreateLandingPageInput = z.input<typeof createSchema>;
export type SavePageSettingsInput = z.input<typeof settingsSchema>;
const descriptors = (value: unknown) => pageConfigSchema.parse({ sections: Array.isArray(value)
  ? value.map(section => ({ ...section, data: undefined })) : value }).sections.map(({ data: _data, ...section }) => section);

export async function createLandingPage(db: Db | PlatformDb, tenantId: string, raw: CreateLandingPageInput) {
  const input = createSchema.parse(raw, { error: z.locales.vi().localeError }), disabled = await loadDisabledFeatures(db);
  return withTenantTransaction(db, tenantId, async repo => {
    const site = await repo.site.first({ where: { id: input.siteId }, include: { tenant: true } });
    if (!site) throw new SiteSettingsError("Không tìm thấy website", 404);
    const can = canUse(site.tenant, { disabled });
    if (!can("landingPages")) throw new StructureError("Gói không cho tạo landing page");
    // Serialize count + insert; an expected catalog also prevents overwriting a concurrent catalog edit.
    const locked = await repo.site.update(site.id, { pageTypes: site.pageTypes }, { pageTypes: { equals: site.pageTypes } });
    if (!locked.count) throw new SiteSettingsError("Danh mục đã thay đổi. Tải lại trước khi tạo trang.", 409);
    const pages = await repo.page.list({ where: { siteId: site.id } });
    if (pages.some(page => page.slug === input.slug)) throw new SiteSettingsError("Đường dẫn đã được dùng", 409);
    const baseline = siteStructureOf(site, pages.map(page => ({ slug: page.slug, sections: descriptors(page.sections) })));
    const source = input.source;
    const original = source.kind === "duplicate" ? pages.find(page => page.id === source.pageId) : undefined;
    if (source.kind === "duplicate" && !original) throw new SiteSettingsError("Không tìm thấy trang nguồn", 404);
    const rows = original ? await repo.sectionContent.list({ where: { pageId: original.id, siteId: site.id } }) : [];
    const preset = getPreset(site.presetId ?? site.themeId);
    const sections = (source.kind === "template" ? PAGE_TEMPLATES[source.id].sections.map(type => ({
      id: randomUUID(), type, variant: preset?.sections.find(s => s.type === type)?.variant ?? "t15", enabled: true,
    })) : original ? descriptors(original.draftSections ?? original.sections) : []).filter(section => {
      const def = sectionRegistry.getType(section.type);
      if (!def) throw new StructureError("Loại section không tồn tại");
      return !["site-header", "site-footer"].includes(section.type) && (!def.meta.entitlement || can(def.meta.entitlement)) &&
        !rows.some(row => row.sectionId === section.id && row.removedAt !== null);
    // Without `builder` a copied layout could never be published (the new page has no baseline to grandfather it).
    }).map(section => {
      if (can("builder") || !("layout" in section)) return section;
      const { layout: _layout, ...rest } = section;
      return rest;
    });
    // Validate the sections actually created, so creation and first publish apply the same rules.
    const proposed = { ...baseline, pages: [...baseline.pages, { slug: input.slug, sections }] };
    const issues = validateSiteStructure(proposed, { can, pagesLimit: limit(site.tenant, "pages"), baseline });
    if (issues.length) throw new StructureError(issues.join("; "));
    const page = await repo.page.create({ siteId: site.id, slug: input.slug, kind: "landing", title: input.title, sections: [], draftSections: sections, publishedAt: null });
    for (const section of sections) {
      if (!sectionRegistry.variantsOf(section.type)?.includes(section.variant)) throw new StructureError("Kiểu section không tồn tại");
      const def = sectionRegistry.getType(section.type)!;
      const row = rows.find(row => row.sectionId === section.id && row.type === section.type);
      await repo.sectionContent.create({ siteId: site.id, pageId: page.id, sectionId: section.id, type: section.type,
        data: def.defaults as Prisma.InputJsonValue, draftData: (row?.draftData ?? row?.data ?? def.defaults) as Prisma.InputJsonValue,
        schemaVersion: row?.schemaVersion ?? def.schemaVersion });
    }
    return { pageId: page.id };
  });
}

export async function savePageSettings(db: Db | PlatformDb, tenantId: string, raw: SavePageSettingsInput) {
  const input = settingsSchema.parse(raw, { error: z.locales.vi().localeError }), disabled = await loadDisabledFeatures(db);
  return withTenantTransaction(db, tenantId, async repo => {
    const page = await repo.page.get(input.pageId);
    if (!page) throw new SiteSettingsError("Không tìm thấy trang", 404);
    if (!page.slug || !isLandingSlug(page.slug)) throw new StructureError("Chỉ được cài đặt trang landing");
    const site = await repo.site.first({ where: { id: page.siteId }, include: { tenant: true } });
    if (!site || !canUse(site.tenant, { disabled })("landingPages")) throw new StructureError("Gói không cho cài đặt landing page");
    await repo.page.update(page.id, { title: input.title, settings: input.settings });
    // Read after acquiring the page write lock: a concurrent first publish must invalidate the new settings too.
    const saved = (await repo.page.get(page.id))!;
    if (saved.publishedAt) await enqueueInvalidate(repo, [pageTag(tenantId, page.slug), siteTag(tenantId)]);
    return { pageId: page.id };
  });
}
