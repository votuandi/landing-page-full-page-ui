import { z } from "zod";
import type { Session } from "@solar/auth";
import { RevisionConflictError, StructureError, type DraftInput, type PublishInput } from "@solar/db";
import { pageConfigSchema, pageSectionSchema, sectionRegistry } from "@solar/sections";
import type { EditableSection } from "@solar/cms-ui";
import type { ActionContext, ActionResult } from "./action.ts";

const descriptorSchema = pageSectionSchema.omit({ data: true }).strict();
const descriptorsSchema = z.array(descriptorSchema).max(200).superRefine((sections, ctx) => {
  const parsed = pageConfigSchema.safeParse({ sections: sections.map(s => ({ ...s, data: undefined })) });
  if (!parsed.success) ctx.addIssue({ code: "custom", message: "Dữ liệu không hợp lệ" });
});
export const pageIdSchema = z.object({ pageId: z.uuid() });
export const pageRevisionSchema = pageIdSchema.extend({ revision: z.coerce.number().int().min(0) });
export const saveSectionsSchema = pageRevisionSchema.extend({ sections: z.string().max(200_000) });
type PageRow = { id: string; siteId: string; slug: string; title: unknown; revision: number; sections: unknown; draftSections: unknown; hasDraft: boolean };
export type PageSectionsDeps = {
  tenant(): Promise<{ tenantId: string; siteId: string; slug: string }>;
  page(siteId: string, pageId: string): Promise<PageRow | null>;
  entitlements(): Promise<(feature: string) => boolean>;
  contents(siteId: string, pageId: string): Promise<{ sectionId: string; type: string }[]>;
  actor(session: Session): Promise<PublishInput["actor"] | null>;
  save(tenantId: string, input: DraftInput): Promise<{ revision: number }>;
  publish(tenantId: string, input: PublishInput): Promise<{ revision: number }>;
  preview(tenantId: string, siteId: string, slug: string, path: string): Promise<string>;
};
export const pageTitle = (title: unknown, slug: string) => typeof title === "object" && title !== null && "vi" in title && typeof title.vi === "string" && title.vi
  ? title.vi : slug ? `/${slug}` : "Trang chủ";
const readSections = (value: unknown) => descriptorsSchema.parse(value);

export async function loadPageEditor(pageId: string, deps: PageSectionsDeps & { requirePermission(permission: "pages.view"): Promise<Session> }) {
  const session = await deps.requirePermission("pages.view");
  if (!z.uuid().safeParse(pageId).success) return null;
  const tenant = await deps.tenant();
  const page = await deps.page(tenant.siteId, pageId);
  if (!page || page.siteId !== tenant.siteId) return null;
  const can = await deps.entitlements(), structure = session.permissions.has("pages.structure");
  const types = Object.values(sectionRegistry.types);
  return { page: { id: page.id, slug: page.slug, title: pageTitle(page.title, page.slug), revision: page.revision },
    sections: readSections(page.draftSections ?? page.sections), hasDraft: page.hasDraft,
    can: { reorder: structure && can("sectionReorder"), variantSwitch: structure && can("variantSwitch") },
    allowedTypes: types.filter(def => !def.meta.entitlement || can(def.meta.entitlement)).map(def => def.type),
    lockedTypes: types.filter(def => def.meta.entitlement && !can(def.meta.entitlement)).map(def => def.type),
    canPublish: session.permissions.has("pages.publish") };
}
export type PageEditor = NonNullable<Awaited<ReturnType<typeof loadPageEditor>>>;
export type PageSectionResult = ActionResult & { revision?: number; url?: string };

/** Lỗi ngoài dự kiến để wrapper action xử lý, không lộ chi tiết nội bộ. */
async function mutation(work: () => Promise<{ revision: number }>): Promise<PageSectionResult> {
  try { return { ok: true, ...await work() }; }
  catch (error) {
    if (error instanceof RevisionConflictError) return { ok: false, status: 409, error: error.message };
    if (error instanceof StructureError) {
      return { ok: false, status: 400, error: error.message };
    }
    throw error;
  }
}
export function createPageSectionHandlers(deps: PageSectionsDeps) {
  async function ownPage(id: string, context: ActionContext) {
    const tenant = await deps.tenant();
    if (tenant.tenantId !== context.tenantId) return null;
    const page = await deps.page(tenant.siteId, id);
    return page?.siteId === tenant.siteId ? { page, tenant } : null;
  }
  const missing = { ok: false, status: 404, error: "Không tìm thấy trang" };
  const forbiddenActor = { ok: false, status: 403, error: "Phiên hiện tại chưa hỗ trợ lưu hoặc xuất bản trang." };
  return {
    async save(input: z.output<typeof saveSectionsSchema>, context: ActionContext): Promise<PageSectionResult> {
      let sections: EditableSection[];
      try { sections = readSections(JSON.parse(input.sections)); }
      catch { return { ok: false, status: 400, error: "Dữ liệu không hợp lệ" }; }
      const own = await ownPage(input.pageId, context);
      if (!own) return missing;
      for (const section of sections) {
        if (!sectionRegistry.variantsOf(section.type)?.includes(section.variant)) return { ok: false, status: 400, error: `Kiểu hiển thị không tồn tại: ${section.type}/${section.variant}` };
      }
      const actor = await deps.actor(context.session!);
      if (!actor) return forbiddenActor;
      // Descriptor đã xóa có thể được phục hồi: không ghi defaults đè lên nội dung giữ lại.
      const contents = await deps.contents(own.tenant.siteId, input.pageId);
      if (sections.some(section => contents.some(c => c.sectionId === section.id && c.type !== section.type))) return { ok: false, status: 400, error: "Không thể thay đổi loại của section đã có nội dung" };
      const fresh = sections.filter(section => !contents.some(c => c.sectionId === section.id));
      return mutation(() => deps.save(context.tenantId, { pageId: input.pageId, expectedRevision: input.revision, actor,
        draftSections: sections, sections: fresh.map(section => ({ sectionId: section.id, type: section.type, draftData: sectionRegistry.getType(section.type)!.defaults })) }));
    },
    async publish(input: z.output<typeof pageRevisionSchema>, context: ActionContext): Promise<PageSectionResult> {
      if (!await ownPage(input.pageId, context)) return missing;
      const actor = await deps.actor(context.session!);
      if (!actor) return forbiddenActor;
      return mutation(() => deps.publish(context.tenantId, { pageId: input.pageId, expectedRevision: input.revision, actor }));
    },
    async preview(input: z.output<typeof pageIdSchema>, context: ActionContext): Promise<PageSectionResult> {
      const own = await ownPage(input.pageId, context);
      if (!own) return missing;
      return { ok: true, url: await deps.preview(context.tenantId, own.tenant.siteId, own.tenant.slug, `/${own.page.slug}`) };
    },
  };
}
