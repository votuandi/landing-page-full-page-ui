import { z } from "zod";
import { collectionDefs, collectionInputSchema, CollectionError, type Collection, type CollectionInput, type CollectionRow } from "@solar/db";
import type { Session } from "@solar/auth";
import type { ActionContext, ActionResult } from "./action.ts";
import { authorize } from "./gate.ts";

export const collectionTypes = (can: (feature: string) => boolean) => Object.values(collectionDefs).filter(d => !d.entitlement || can(d.entitlement));
export const requireCollection = (path: string, can: (feature: string) => boolean) => collectionTypes(can).find(d => d.path === path) ?? null;
const pathSchema = z.string().min(1).max(100);
export const saveCollectionSchema = z.object({ collection: pathSchema, payload: z.string().max(500_000) });
export const collectionIdSchema = z.object({ collection: pathSchema, id: z.uuid() });
export const reorderCollectionSchema = z.object({ collection: pathSchema, ids: z.string().max(25_000) });
export type CollectionsDeps = {
  requirePermission(permission: "content.edit"): Promise<Session>;
  tenant(): Promise<{ tenantId: string }>;
  entitlements(): Promise<(feature: string) => boolean>;
  list(tenantId: string, name: Collection): Promise<CollectionRow[]>;
  count(tenantId: string, name: Collection): Promise<number>;
  item(tenantId: string, name: Collection, id: string): Promise<CollectionRow | null>;
  save(tenantId: string, name: Collection, input: CollectionInput): Promise<{ id: string; slug: string }>;
  duplicate(tenantId: string, name: Collection, id: string): Promise<{ id: string }>;
  remove(tenantId: string, name: Collection, id: string): Promise<void>;
  reorder(tenantId: string, name: Collection, ids: string[]): Promise<void>;
};
export type CollectionQuery = { q?: string; status?: string; filter?: string; filterKey?: string };
export const parseCollectionQuery = (query: unknown): CollectionQuery => z.object({
  q: z.string().max(200).optional().catch(""), status: z.enum(["", "draft", "published"]).optional().catch(""),
  filter: z.string().max(200).optional().catch(""), filterKey: z.string().max(100).optional().catch(""),
}).parse(query);
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
export const collectionTitle = (row: { title: unknown; slug: string }) => row.title && typeof row.title === "object" && "vi" in row.title && typeof row.title.vi === "string" ? row.title.vi : row.slug;
export async function loadCollectionIndex(deps: CollectionsDeps) {
  await deps.requirePermission("content.edit");
  const [tenant, can] = await Promise.all([deps.tenant(), deps.entitlements()]);
  return Promise.all(collectionTypes(can).map(async d => ({ name: d.name, path: d.path, label: d.label.vi, count: await deps.count(tenant.tenantId, d.name) })));
}
export async function loadCollectionList(path: string, query: CollectionQuery, deps: CollectionsDeps) {
  await deps.requirePermission("content.edit");
  query = parseCollectionQuery(query);
  const can = await deps.entitlements(), definition = requireCollection(path, can);
  if (!definition) return null;
  const tenant = await deps.tenant(), all = await deps.list(tenant.tenantId, definition.name);
  const limited = all.length > 500, source = all.slice(0, 500);
  const filterKey = definition.filters?.includes(query.filterKey ?? "") ? query.filterKey! : definition.filters?.[0];
  const q = normalize((query.q ?? "").slice(0, 200).trim());
  const rows = source.filter(row => (!q || normalize(`${row.slug} ${collectionTitle(row)}`).includes(q))
    && (!query.status || row.status === query.status) && (!query.filter || filterKey && String(row[filterKey] ?? "") === query.filter));
  return { definition, rows, limited, filterKey, filterOptions: filterKey ? [...new Set(source.map(row => String(row[filterKey] ?? "")).filter(Boolean))] : [],
    canReorder: !query.q && !query.status && !query.filter && !limited };
}
export async function loadCollectionItem(path: string, id: string | undefined, deps: CollectionsDeps) {
  await deps.requirePermission("content.edit");
  const can = await deps.entitlements(), definition = requireCollection(path, can);
  if (!definition || id !== undefined && !z.uuid().safeParse(id).success) return null;
  const tenant = await deps.tenant(), row = id ? await deps.item(tenant.tenantId, definition.name, id) : null;
  if (id && !row) return null;
  const columns = row ? Object.fromEntries(Object.keys(definition.columns.shape).map(key => [key, row[key]])) : definition.defaults.columns;
  return { name: definition.name, bilingual: can("bilingual"), input: row
    ? { id: row.id, title: row.title, slug: row.slug, status: row.status, columns, data: row.data }
    : { ...definition.defaults, slug: "", status: "draft" as const } };
}
export function createCollectionHandlers(deps: CollectionsDeps) {
  async function run(path: string, context: ActionContext, work: (name: Collection) => Promise<ActionResult>): Promise<ActionResult> {
    authorize(context.session, context.tenantId, "content.edit");
    const definition = Object.values(collectionDefs).find(d => d.path === path);
    if (!definition) return { ok: false, status: 400, error: "Collection không hợp lệ" };
    const can = await deps.entitlements();
    if (definition.entitlement && !can(definition.entitlement)) return { ok: false, status: 403, error: `Gói hiện tại không có ${definition.label.vi}` };
    try { return await work(definition.name); }
    catch (error) {
      if (error instanceof CollectionError) return { ok: false, status: error.status, error: error.message };
      throw error;
    }
  }
  return {
    save(input: z.output<typeof saveCollectionSchema>, context: ActionContext) {
      return run(input.collection, context, async name => {
        let raw: unknown;
        try {
          if (Buffer.byteLength(input.payload) > 500_000) throw Error();
          raw = JSON.parse(input.payload);
        } catch { return { ok: false, status: 400, error: "Dữ liệu không hợp lệ hoặc quá 500 kB" }; }
        const parsed = collectionInputSchema(name).safeParse(raw, { error: z.locales.vi().localeError });
        if (!parsed.success) return { ok: false, status: 400, error: parsed.error.issues.map(i => i.message).join("; ") };
        const can = await deps.entitlements();
        if (!can("bilingual")) {
          // Preserve existing translations for a downgraded tenant; never allow editing EN outside the plan.
          const existing = parsed.data.id ? await deps.item(context.tenantId, name, parsed.data.id) : null;
          const title = existing?.title as { en?: string } | undefined;
          if (parsed.data.title.en !== undefined && parsed.data.title.en !== title?.en) return { ok: false, status: 403, error: "Gói hiện tại không có nội dung song ngữ" };
          if (title?.en !== undefined) parsed.data.title.en = title.en;
        }
        await deps.save(context.tenantId, name, parsed.data);
        return { ok: true, message: "Đã lưu nội dung" };
      });
    },
    duplicate(input: z.output<typeof collectionIdSchema>, context: ActionContext) {
      return run(input.collection, context, async name => { await deps.duplicate(context.tenantId, name, input.id); return { ok: true, message: "Đã nhân bản thành bản nháp" }; });
    },
    remove(input: z.output<typeof collectionIdSchema>, context: ActionContext) {
      return run(input.collection, context, async name => { await deps.remove(context.tenantId, name, input.id); return { ok: true, message: "Đã xóa nội dung" }; });
    },
    reorder(input: z.output<typeof reorderCollectionSchema>, context: ActionContext) {
      return run(input.collection, context, async name => {
        let ids: unknown;
        try { ids = JSON.parse(input.ids); } catch { return { ok: false, status: 400, error: "Danh sách sắp xếp không hợp lệ" }; }
        const parsed = z.array(z.uuid()).max(500).safeParse(ids);
        if (!parsed.success) return { ok: false, status: 400, error: "Danh sách sắp xếp không hợp lệ" };
        await deps.reorder(context.tenantId, name, parsed.data); return { ok: true, message: "Đã lưu thứ tự" };
      });
    },
  };
}
