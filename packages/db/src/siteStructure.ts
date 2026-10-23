import { z } from "zod";
import { siteTag } from "@solar/cache";
import { canUse, limit } from "@solar/plans";
import { getPreset, isPageType, PAGE_TYPES, presetStructure, siteStructureOf, validateSiteStructure } from "@solar/presets";
import { pageConfigSchema, sectionRegistry } from "@solar/sections";
import { loadDisabledFeatures, type Db, type PlatformDb } from "./client.ts";
import { withTenantTransaction } from "./tenantTransaction.ts";
import { StructureError } from "./publish.ts";
import { SiteSettingsError } from "./siteSettings.ts";
import { enqueueInvalidate } from "./invalidate.ts";
import type { Prisma } from "../generated/client.ts";

const inputSchema = z.strictObject({ siteId: z.uuid(), pageTypes: z.array(z.string().refine(isPageType)).max(20), expected: z.array(z.string()).max(20) });
export async function setPageTypes(db: Db | PlatformDb, tenantId: string, raw: z.input<typeof inputSchema>) {
  const input = inputSchema.parse(raw), disabled = await loadDisabledFeatures(db);
  return withTenantTransaction(db, tenantId, async repo => {
    const site = await repo.site.first({ where: { id: input.siteId }, include: { tenant: true } });
    if (!site) throw new SiteSettingsError("Không tìm thấy website", 404);
    const can = canUse(site.tenant, { disabled });
    if (!can("pageStructure")) throw new StructureError("Gói không cho đổi cấu trúc trang");
    const conflict = () => new SiteSettingsError("Danh mục đã thay đổi. Tải lại trước khi lưu.", 409);
    if (JSON.stringify(site.pageTypes) !== JSON.stringify(input.expected)) throw conflict();
    if (new Set(input.pageTypes).size !== input.pageTypes.length) throw new StructureError("Loại trang bị trùng");
    // Acquire the site row before creating missing pages; competing catalog writes cannot interleave.
    const saved = await repo.site.update(site.id, { pageTypes: input.pageTypes }, { pageTypes: { equals: input.expected } });
    if (!saved.count) throw conflict();
    const rows = await repo.page.list({ where: { siteId: site.id } });
    const read = (value: unknown) => pageConfigSchema.parse({ sections: Array.isArray(value)
      ? value.map(section => ({ ...section, data: undefined })) : value }).sections.map(({ data: _data, ...s }) => s);
    const baseline = siteStructureOf(site, rows.map(p => ({ slug: p.slug, sections: read(p.sections) })));
    const preset = getPreset(site.presetId ?? site.themeId);
    if (!preset) throw new StructureError("Không tìm thấy cấu hình trang mặc định");
    const defaults = presetStructure({ ...preset, pages: input.pageTypes }, can);
    for (const type of input.pageTypes) {
      const def = PAGE_TYPES[type];
      if (def.kind !== "page" || rows.some(p => p.slug === def.slug)) continue;
      const sections = defaults.pages.find(p => p.type === type)?.sections ?? [];
      const page = await repo.page.create({ siteId: site.id, slug: def.slug, kind: type === "home" ? "home" : "landing", title: { vi: def.label.vi }, sections: [...sections] });
      rows.push(page);
      for (const section of sections) await repo.sectionContent.create({ siteId: site.id, pageId: page.id, sectionId: section.id,
        type: section.type, data: sectionRegistry.getType(section.type)!.defaults as Prisma.InputJsonValue });
    }
    const proposed = siteStructureOf({ pageTypes: input.pageTypes }, rows.map(p => ({ slug: p.slug, sections: read(p.sections) })));
    const errors = validateSiteStructure(proposed, { can, pagesLimit: limit(site.tenant, "pages"), baseline });
    if (errors.length) throw new StructureError(errors.join("; "));
    await enqueueInvalidate(repo, [siteTag(tenantId)]);
    return { pageTypes: input.pageTypes };
  });
}
