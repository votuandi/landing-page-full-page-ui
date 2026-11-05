import { randomUUID } from "node:crypto";
import { z } from "zod";
import { pageTag } from "@solar/cache";
import { canUse } from "@solar/plans";
import { isLandingSlug } from "@solar/presets";
import { pageConfigSchema } from "@solar/sections";
import { loadDisabledFeatures, type Db, type PlatformDb } from "./client.ts";
import { tenantTransaction, withTenantTransaction } from "./tenantTransaction.ts";
import { forTenant } from "./repository.ts";
import { StructureError } from "./publish.ts";
import { SiteSettingsError } from "./siteSettings.ts";
import { enqueueInvalidate } from "./invalidate.ts";

const localized = (max: number) => z.strictObject({ vi: z.string().max(max), en: z.string().max(max).optional() });
const titleSchema = z.strictObject({ lead: localized(60), highlight: localized(60), sub: localized(60), subHighlight: localized(60) });
export const abTestSchema = z.strictObject({
  id: z.uuid(), status: z.enum(["running", "ended"]), title: titleSchema, ctaLabel: localized(80), winner: z.enum(["A", "B"]).optional(),
}).refine(value => value.status === "ended" ? !!value.winner : !value.winner, { message: "Vui lòng chọn phiên bản thắng khi kết thúc thử nghiệm" });
export type AbTest = z.infer<typeof abTestSchema>;
export function parseAbTest(value: unknown): AbTest | null {
  if (value == null) return null;
  const result = abTestSchema.safeParse(value);
  if (result.success) return result.data;
  console.error("[abTest] Cấu hình thử nghiệm không hợp lệ");
  return null;
}
const saveSchema = z.discriminatedUnion("action", [
  z.strictObject({ pageId: z.uuid(), action: z.literal("start"), title: titleSchema, ctaLabel: localized(80) }),
  z.strictObject({ pageId: z.uuid(), action: z.literal("end"), winner: z.enum(["A", "B"]) }),
]);
export type SaveAbTestInput = z.input<typeof saveSchema>;

export async function saveAbTest(db: Db | PlatformDb, tenantId: string, raw: SaveAbTestInput) {
  const input = saveSchema.parse(raw, { error: z.locales.vi().localeError }), disabled = await loadDisabledFeatures(db);
  return withTenantTransaction(db, tenantId, async repo => {
    const page = await repo.page.get(input.pageId);
    if (!page) throw new SiteSettingsError("Không tìm thấy trang", 404);
    const site = await repo.site.first({ where: { id: page.siteId }, include: { tenant: true } });
    if (!site || !canUse(site.tenant, { disabled })("abTest")) throw new StructureError("Gói không cho thử nghiệm A/B");
    if (page.kind !== "landing" || !page.slug || !isLandingSlug(page.slug)) throw new StructureError("Chỉ được thử nghiệm trên trang landing");
    // Lock the page before reading the current test: simultaneous starts must share one id.
    await repo.page.update(page.id, { updatedAt: new Date() });
    const current = (await repo.page.get(page.id))!;
    const sections = current.draftSections ?? current.sections;
    const layout = pageConfigSchema.safeParse({ sections: Array.isArray(sections) ? sections.map(section => ({ ...section as object, data: undefined })) : sections });
    if (!layout.success || !layout.data.sections.some(section => section.type === "hero" && section.enabled)) throw new StructureError("Trang không có hero đang bật");
    const previous = parseAbTest(current.abTest);
    if (input.action === "end" && !previous) throw new StructureError("Chưa có thử nghiệm A/B");
    const abTest: AbTest = input.action === "start"
      ? { id: previous?.status === "running" ? previous.id : randomUUID(), status: "running", title: input.title, ctaLabel: input.ctaLabel }
      : { ...previous!, status: "ended", winner: input.winner };
    await repo.page.update(page.id, { abTest });
    if (current.publishedAt) await enqueueInvalidate(repo, [pageTag(tenantId, page.slug)]);
    return { abTest };
  });
}

export async function runningAbTest(db: Db | PlatformDb, tenantId: string, siteId: string, slug: string) {
  const page = await forTenant(db, tenantId).page.first({ where: { siteId, slug, kind: "landing", publishedAt: { not: null } } });
  const ab = parseAbTest(page?.abTest);
  return ab?.status === "running" ? { id: ab.id } : null;
}

export async function recordAbView(db: Db | PlatformDb, tenantId: string, siteId: string, testId: string, variant: "A" | "B") {
  return tenantTransaction(db, tenantId, async tx => {
    // Lock against end/restart; the upsert increments atomically, including concurrent first views.
    const pages = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Page"
      WHERE "tenantId" = ${tenantId}::uuid AND "siteId" = ${siteId}::uuid AND "kind" = 'landing'
        AND "publishedAt" IS NOT NULL AND "abTest"->>'id' = ${testId} AND "abTest"->>'status' = 'running' FOR SHARE`;
    if (!pages[0]) return false;
    await tx.$executeRaw`INSERT INTO "AbTestView" ("tenantId", "pageId", "testId", "variant", "views")
      VALUES (${tenantId}::uuid, ${pages[0].id}::uuid, ${testId}::uuid, ${variant}, 1)
      ON CONFLICT ("tenantId", "testId", "variant") DO UPDATE SET "views" = "AbTestView"."views" + 1`;
    return true;
  });
}

export async function abTestStats(db: Db | PlatformDb, tenantId: string, testId: string) {
  return tenantTransaction(db, tenantId, async tx => {
    const views = await tx.$queryRaw<{ variant: string; total: bigint }[]>`SELECT "variant", sum("views") AS total FROM "AbTestView"
      WHERE "tenantId" = ${tenantId}::uuid AND "testId" = ${testId}::uuid GROUP BY "variant"`;
    const leads = await tx.$queryRaw<{ variant: string; total: bigint }[]>`SELECT "abVariant" AS variant, count(*) AS total FROM "Lead"
      WHERE "tenantId" = ${tenantId}::uuid AND "abTestId" = ${testId}::uuid AND "status" <> 'spam' GROUP BY "abVariant"`;
    const stats = { A: { views: 0, leads: 0 }, B: { views: 0, leads: 0 } };
    for (const row of views) if (row.variant === "A" || row.variant === "B") stats[row.variant].views = Number(row.total);
    for (const row of leads) if (row.variant === "A" || row.variant === "B") stats[row.variant].leads = Number(row.total);
    return stats;
  });
}
