import { z } from "zod";
import type { Session } from "@solar/auth";
import { RevisionConflictError, StructureError, type DraftInput, type PublishInput, type RestoreInput } from "@solar/db";
import { migrateSectionData, pageConfigSchema, pageSectionSchema, sectionRegistry } from "@solar/sections";
import type { EditableSection } from "@solar/cms-ui";
import type { ActionContext, ActionResult } from "./action.ts";
import { sectionFormType } from "./sectionForms.ts";
import { getTheme } from "@solar/themes";

const descriptorSchema = pageSectionSchema.omit({ data: true }).strict();
const descriptorsSchema = z.array(descriptorSchema).max(200).superRefine((sections, ctx) => {
  const parsed = pageConfigSchema.safeParse({ sections: sections.map(s => ({ ...s, data: undefined })) });
  if (!parsed.success) ctx.addIssue({ code: "custom", message: "Dữ liệu không hợp lệ" });
});
export const pageIdSchema = z.object({ pageId: z.uuid() });
export const pageRevisionSchema = pageIdSchema.extend({ revision: z.coerce.number().int().min(0) });
export const restoreVersionSchema = pageRevisionSchema.extend({ versionId: z.uuid() });
export const presenceSchema = pageIdSchema.extend({ clientId: z.uuid() });
export const saveSectionsSchema = pageRevisionSchema.extend({ sections: z.string().max(200_000) });
export const saveContentSchema = pageRevisionSchema.extend({ sectionId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/), data: z.string().max(500_000) });
const oldContent = "Nội dung cần cập nhật phiên bản trước khi sửa";
type PageRow = { id: string; siteId: string; slug: string; title: unknown; revision: number; sections: unknown; draftSections: unknown; hasDraft: boolean };
type ContentRow = { type: string; schemaVersion: number; data: unknown; draftData: unknown };
export type PageSectionsDeps = {
  tenant(): Promise<{ tenantId: string; siteId: string; slug: string }>;
  page(siteId: string, pageId: string): Promise<PageRow | null>;
  entitlements(): Promise<(feature: string) => boolean>;
  theme(siteId: string): Promise<string>;
  removed(siteId: string, pageId: string): Promise<(EditableSection & { expiresAt: string | null })[]>;
  contents(siteId: string, pageId: string): Promise<{ sectionId: string; type: string }[]>;
  content(siteId: string, pageId: string, sectionId: string): Promise<{ type: string; schemaVersion: number; data: unknown; draftData: unknown } | null>;
  contentRows(siteId: string, pageId: string): Promise<(ContentRow & { sectionId: string })[]>;
  actor(session: Session): Promise<PublishInput["actor"] | null>;
  save(tenantId: string, input: DraftInput): Promise<{ revision: number }>;
  publish(tenantId: string, input: PublishInput): Promise<{ revision: number }>;
  restore(tenantId: string, input: RestoreInput): Promise<{ revision: number }>;
  versions(siteId: string, pageId: string): Promise<{ id: string; revision: number; createdAt: string; publisher: string }[]>;
  presence(tenantId: string, pageId: string, clientId: string, session: Session): Promise<string[]>;
  preview(tenantId: string, siteId: string, slug: string, path: string): Promise<string>;
};
export const pageTitle = (title: unknown, slug: string) => typeof title === "object" && title !== null && "vi" in title && typeof title.vi === "string" && title.vi
  ? title.vi : slug ? `/${slug}` : "Trang chủ";
const readSections = (value: unknown) => descriptorsSchema.parse(value);
function typeAccess(can: (feature: string) => boolean) {
  const types = Object.values(sectionRegistry.types);
  return {
    allowedTypes: types.filter(def => !def.meta.entitlement || can(def.meta.entitlement)).map(def => def.type),
    lockedTypes: types.filter(def => def.meta.entitlement && !can(def.meta.entitlement)).map(def => def.type),
  };
}

export function recoverRemovedSections(page: { sections: unknown; draftSections: unknown }, contents: { sectionId: string; type: string; removedAt: Date | null }[], snapshots: unknown[]) {
  const current = readSections(page.draftSections ?? page.sections);
  const history = [readSections(page.sections), ...snapshots.map(snapshot => {
    const parsed = descriptorsSchema.safeParse((snapshot as { sections?: unknown } | null)?.sections);
    return parsed.success ? parsed.data : [];
  })].flat();
  return contents.filter(c => !current.some(s => s.id === c.sectionId)).flatMap(c => {
    const descriptor = history.find(s => s.id === c.sectionId && s.type === c.type);
    const variant = descriptor?.variant ?? sectionRegistry.variantsOf(c.type)?.[0];
    return variant ? [{ ...descriptor, id: c.sectionId, type: c.type, variant, enabled: descriptor?.enabled ?? true,
      expiresAt: c.removedAt ? new Date(c.removedAt.getTime() + 30 * 86400000).toISOString() : null }] : [];
  });
}

export async function loadPageEditor(pageId: string, deps: PageSectionsDeps & { requirePermission(permission: "pages.view"): Promise<Session> }) {
  const session = await deps.requirePermission("pages.view");
  if (!z.uuid().safeParse(pageId).success) return null;
  const tenant = await deps.tenant();
  const page = await deps.page(tenant.siteId, pageId);
  if (!page || page.siteId !== tenant.siteId) return null;
  const [can, themeId, removed, versions] = await Promise.all([deps.entitlements(), deps.theme(tenant.siteId), deps.removed(tenant.siteId, pageId), deps.versions(tenant.siteId, pageId)]);
  const structure = session.permissions.has("pages.structure");
  return { page: { id: page.id, slug: page.slug, title: pageTitle(page.title, page.slug), revision: page.revision },
    sections: readSections(page.draftSections ?? page.sections), hasDraft: page.hasDraft, themeId, removed, versions,
    canRestore: structure && session.permissions.has("pages.publish") && session.permissions.has("content.edit"),
    can: { reorder: structure && can("sectionReorder"), variantSwitch: structure && can("variantSwitch") },
    ...typeAccess(can),
    canBuilder: can("builder"), canEditContent: session.permissions.has("content.edit"), canPublish: session.permissions.has("pages.publish") };
}
export type PageEditor = NonNullable<Awaited<ReturnType<typeof loadPageEditor>>>;
export function readSectionData(section: EditableSection, def: NonNullable<ReturnType<typeof sectionFormType>>, row: ContentRow | null) {
  let data: unknown = def.defaults, recovered = false;
  try {
    if (row) {
      if (row.type !== section.type) throw new Error("Section type mismatch");
      data = def.schema.parse(migrateSectionData(def, row.schemaVersion, row.draftData ?? row.data).data);
    }
  } catch { recovered = true; }
  return { data, recovered, readOnly: row && row.schemaVersion !== def.schemaVersion ? oldContent : undefined };
}
export const builderPath = (slug: string, reorder: boolean) => `/${slug}?builder=1${reorder ? "" : "&reorder=0"}`;
export async function loadBuilder(pageId: string, deps: PageSectionsDeps & { requirePermission(permission: "pages.view"): Promise<Session> }) {
  const session = await deps.requirePermission("pages.view");
  if (!pageIdSchema.safeParse({ pageId }).success) return null;
  const tenant = await deps.tenant(), page = await deps.page(tenant.siteId, pageId);
  if (!page || page.siteId !== tenant.siteId) return null;
  const can = await deps.entitlements();
  if (!can("builder")) return null;
  const sections = readSections(page.draftSections ?? page.sections);
  const [rows, themeId] = await Promise.all([deps.contentRows(tenant.siteId, pageId), deps.theme(tenant.siteId)]);
  const forms: Record<string, ReturnType<typeof readSectionData>> = Object.fromEntries(sections.flatMap(section => {
    const def = sectionFormType(section.type, can);
    return def ? [[section.id, readSectionData(section, def, rows.find(row => row.sectionId === section.id) ?? null)]] : [];
  }));
  const reorder = session.permissions.has("pages.structure") && can("sectionReorder");
  return { page: { id: page.id, title: pageTitle(page.title, page.slug), revision: page.revision }, sections, forms, themeId, themeSupportsDark: Boolean(getTheme(themeId)?.meta.supportsDark), ...typeAccess(can),
    canReorder: reorder, canEditContent: session.permissions.has("content.edit"), bilingual: can("bilingual"),
    previewUrl: await deps.preview(tenant.tenantId, tenant.siteId, tenant.slug, builderPath(page.slug, reorder)) };
}
export type BuilderEditor = NonNullable<Awaited<ReturnType<typeof loadBuilder>>>;
export async function loadSectionContent(pageId: string, sectionId: string, deps: PageSectionsDeps & { requirePermission(permission: "content.edit"): Promise<Session> }) {
  await deps.requirePermission("content.edit");
  if (!pageIdSchema.safeParse({ pageId }).success || !/^[A-Za-z0-9_-]{1,64}$/.test(sectionId)) return null;
  const tenant = await deps.tenant(), page = await deps.page(tenant.siteId, pageId);
  if (!page || page.siteId !== tenant.siteId) return null;
  const section = readSections(page.draftSections ?? page.sections).find(s => s.id === sectionId);
  if (!section) return null;
  const can = await deps.entitlements(), def = sectionFormType(section.type, can);
  if (!def) return null;
  const row = await deps.content(tenant.siteId, pageId, sectionId);
  return { page: { id: page.id, slug: page.slug, title: pageTitle(page.title, page.slug), revision: page.revision },
    section: { ...section, label: def.meta.label.vi }, ...readSectionData(section, def, row), bilingual: can("bilingual"), previewPath: `/${page.slug}` };
}
export type SectionContent = NonNullable<Awaited<ReturnType<typeof loadSectionContent>>>;
export type PageSectionResult = ActionResult & { revision?: number; url?: string; editors?: string[] };

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
    async restore(input: z.output<typeof restoreVersionSchema>, context: ActionContext): Promise<PageSectionResult> {
      if (!await ownPage(input.pageId, context)) return missing;
      if (!(["pages.publish", "pages.structure", "content.edit"] as const).every(p => context.session?.permissions.has(p))) {
        return { ok: false, status: 403, error: "Bạn không có quyền khôi phục phiên bản" };
      }
      const actor = await deps.actor(context.session!);
      if (!actor) return forbiddenActor;
      return mutation(() => deps.restore(context.tenantId, { pageId: input.pageId, versionId: input.versionId, expectedRevision: input.revision, actor }));
    },
    async presence(input: z.output<typeof presenceSchema>, context: ActionContext): Promise<PageSectionResult> {
      if (!await ownPage(input.pageId, context)) return missing;
      if (!context.session?.permissions.has("pages.view") || !(await deps.entitlements())("builder")) {
        return { ok: false, status: 403, error: "Gói hoặc quyền hiện tại chưa có trình dựng" };
      }
      return { ok: true, editors: await deps.presence(context.tenantId, input.pageId, input.clientId, context.session) };
    },
    async saveContent(input: z.output<typeof saveContentSchema>, context: ActionContext): Promise<PageSectionResult> {
      const own = await ownPage(input.pageId, context);
      if (!own) return missing;
      const section = readSections(own.page.draftSections ?? own.page.sections).find(s => s.id === input.sectionId);
      if (!section) return missing;
      const def = sectionFormType(section.type, await deps.entitlements());
      if (!def) return { ok: false, status: 403, error: "Section không thuộc gói hiện tại" };
      let data: unknown;
      try { data = def.schema.parse(JSON.parse(input.data)); }
      catch { return { ok: false, status: 400, error: "Dữ liệu không hợp lệ" }; }
      const row = await deps.content(own.tenant.siteId, input.pageId, input.sectionId);
      if (row && row.type !== section.type) return { ok: false, status: 400, error: "Không thể thay đổi loại của section đã có nội dung" };
      if (row && row.schemaVersion !== def.schemaVersion) return { ok: false, status: 409, error: oldContent };
      const actor = await deps.actor(context.session!);
      if (!actor) return forbiddenActor;
      return mutation(() => deps.save(context.tenantId, { pageId: input.pageId, expectedRevision: input.revision, actor,
        sections: [{ sectionId: section.id, type: section.type, draftData: data }] }));
    },
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
    async builderPreview(input: z.output<typeof pageIdSchema>, context: ActionContext): Promise<PageSectionResult> {
      const own = await ownPage(input.pageId, context);
      if (!own) return missing;
      const can = await deps.entitlements();
      if (!can("builder")) return { ok: false, status: 403, error: "Gói hiện tại chưa có trình dựng" };
      const reorder = Boolean(context.session?.permissions.has("pages.structure")) && can("sectionReorder");
      return { ok: true, url: await deps.preview(context.tenantId, own.tenant.siteId, own.tenant.slug, builderPath(own.page.slug, reorder)) };
    },
  };
}
