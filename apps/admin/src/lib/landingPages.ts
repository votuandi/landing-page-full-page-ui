import { z } from "zod";
import { landingSlugIssue, PAGE_TEMPLATES } from "@solar/presets";
import { SiteSettingsError, StructureError, type CreateLandingPageInput, type SavePageSettingsInput } from "@solar/db";
import type { ActionContext, ActionResult } from "./action.ts";

export const createLandingSchema = z.object({
  title: z.string().trim().min(1).max(200), slug: z.string().refine(value => !landingSlugIssue(value)),
  source: z.enum(["blank", "template", "duplicate"]), templateId: z.string().optional(), sourcePageId: z.string().optional(),
}).superRefine((input, ctx) => {
  if (input.source === "template" && !Object.hasOwn(PAGE_TEMPLATES, input.templateId ?? "")) ctx.addIssue({ code: "custom", message: "Vui lòng chọn mẫu trang" });
  if (input.source === "duplicate" && !z.uuid().safeParse(input.sourcePageId).success) ctx.addIssue({ code: "custom", message: "Vui lòng chọn trang nguồn" });
});
const checkbox = z.enum(["on"]).optional().transform(value => value === "on");
export const saveLandingSettingsSchema = z.object({
  pageId: z.uuid(), title: z.string().trim().min(1).max(200), titleEn: z.string().trim().max(200).optional(),
  seoTitle: z.string().max(70).default(""), seoTitleEn: z.string().max(70).optional(),
  seoDescription: z.string().max(160).default(""), seoDescriptionEn: z.string().max(160).optional(),
  noindex: checkbox, hideHeader: checkbox, hideFooter: checkbox,
});

export function createLandingHandlers(deps: {
  tenant(): Promise<{ tenantId: string; siteId: string }>;
  entitlements(): Promise<(feature: string) => boolean>;
  create(tenantId: string, input: CreateLandingPageInput): Promise<{ pageId: string }>;
  page(pageId: string): Promise<{ siteId: string; slug: string } | null>;
  save(tenantId: string, input: SavePageSettingsInput): Promise<unknown>;
}) {
  async function access(context: ActionContext) {
    const tenant = await deps.tenant();
    if (tenant.tenantId !== context.tenantId) throw new SiteSettingsError("Không tìm thấy website", 404);
    if (!(await deps.entitlements())("landingPages")) throw new StructureError("Gói không cho tạo hoặc cài đặt landing page");
    return tenant;
  }
  async function run(work: () => Promise<ActionResult>): Promise<ActionResult> {
    try { return await work(); }
    catch (error) {
      if (error instanceof SiteSettingsError) return { ok: false, status: error.status, error: error.message };
      if (error instanceof StructureError) return { ok: false, status: 400, error: error.message };
      throw error;
    }
  }
  return {
    create: (input: z.output<typeof createLandingSchema>, context: ActionContext) => run(async () => {
      const tenant = await access(context);
      const source: CreateLandingPageInput["source"] = input.source === "template" ? { kind: "template", id: input.templateId as keyof typeof PAGE_TEMPLATES }
        : input.source === "duplicate" ? { kind: "duplicate", pageId: input.sourcePageId! } : { kind: "blank" };
      const result = await deps.create(context.tenantId, { siteId: tenant.siteId, title: { vi: input.title }, slug: input.slug, source });
      return { ok: true, url: `/trang/${result.pageId}` };
    }),
    save: (input: z.output<typeof saveLandingSettingsSchema>, context: ActionContext) => run(async () => {
      const tenant = await access(context), page = await deps.page(input.pageId);
      if (!page || page.siteId !== tenant.siteId) throw new SiteSettingsError("Không tìm thấy trang", 404);
      const localized = (vi: string, en?: string) => ({ vi, ...(en ? { en } : {}) });
      await deps.save(context.tenantId, { pageId: input.pageId, title: localized(input.title, input.titleEn), settings: {
        seo: { title: localized(input.seoTitle, input.seoTitleEn), description: localized(input.seoDescription, input.seoDescriptionEn), noindex: input.noindex },
        hideHeader: input.hideHeader, hideFooter: input.hideFooter,
      } });
      return { ok: true, message: "Đã lưu cài đặt trang" };
    }),
  };
}
