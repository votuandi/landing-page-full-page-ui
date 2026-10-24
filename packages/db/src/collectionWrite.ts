import { z } from "zod";
import { collectRefs } from "@solar/sections";
import { collectionTag } from "@solar/cache";
import { COLLECTIONS, collectionDefs, collectionInputSchema, slugify, type Collection } from "./collections.ts";
import { publishMedia } from "./media.ts";
import type { Db, PlatformDb } from "./client.ts";
import type { TenantRepo } from "./repository.ts";
import { withTenantTransaction } from "./tenantTransaction.ts";
import { enqueueInvalidate } from "./invalidate.ts";
import { CrossTenantRefError } from "./refs.ts";
import { previewProductCsv } from "./productCsv.ts";

export class CollectionError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409) { super(message); this.name = "CollectionError"; }
}
export type CollectionInput = z.input<ReturnType<typeof collectionInputSchema>>;
export type CollectionRow = { id: string; slug: string; title: unknown; status: "draft" | "published"; order: number; data: unknown; publishedAt: Date | null; [key: string]: unknown };
type Delegate = {
  count(): Promise<number>;
  get(id: string): Promise<CollectionRow | null>;
  list(args?: object): Promise<CollectionRow[]>;
  first(args?: object): Promise<CollectionRow | null>;
  create(data: object): Promise<CollectionRow>;
  update(id: string, data: object): Promise<{ count: number }>;
  delete(id: string): Promise<{ count: number }>;
};
// These twelve models share their content envelope; Prisma exposes different generic delegate signatures.
export const collectionRepository = (repo: TenantRepo, name: Collection) => repo[name] as unknown as Delegate;
function checkName(name: Collection) {
  if (!COLLECTIONS.includes(name)) throw new CollectionError("Collection không hợp lệ", 400);
}
function checkId(id: string) { if (!z.uuid().safeParse(id).success) throw new CollectionError("Mã bản ghi không hợp lệ", 400); }
const missing = () => new CollectionError("Không tìm thấy bản ghi", 404);
async function transaction<T>(db: Db | PlatformDb, tenantId: string, name: Collection, work: (repo: TenantRepo, model: Delegate) => Promise<T>, timeout?: number): Promise<T> {
  checkName(name);
  for (let attempt = 0; ; attempt++) {
    try { return await withTenantTransaction(db, tenantId, repo => work(repo, collectionRepository(repo, name)), { isolationLevel: "Serializable", ...(timeout === undefined ? {} : { timeout }) }); }
    catch (error) {
      const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
      if (code === "P2034" && attempt < 3) continue;
      if (code === "P2002") throw new CollectionError("Đường dẫn đã được dùng", 409);
      if (code === "P2003") throw new CollectionError("Tham chiếu không hợp lệ hoặc khác website", 400);
      if (error instanceof CrossTenantRefError) throw new CollectionError("Tham chiếu không hợp lệ hoặc khác website", 400);
      if (code === "P2034") throw new CollectionError("Dữ liệu vừa thay đổi. Vui lòng thử lại.", 409);
      throw error;
    }
  }
}
const nextOrder = async (model: Delegate) => ((await model.first({ orderBy: { order: "desc" } }))?.order ?? -1) + 1;
const invalidate = (repo: TenantRepo, tenantId: string, name: Collection) => enqueueInvalidate(repo, [collectionTag(tenantId, name)]);

export async function publishItemMedia(repo: TenantRepo, name: Collection, row: Pick<CollectionRow, "status" | "data"> & { coverMediaId?: unknown; logoMediaId?: unknown; posterMediaId?: unknown }) {
  if (row.status !== "published") return;
  const ids = collectRefs(collectionDefs[name].data, row.data).media;
  // Collection schemas also store bare media UUIDs and relational cover/logo columns.
  const data = row.data as Record<string, unknown> | null;
  const values = [row.coverMediaId, row.logoMediaId, row.posterMediaId, data?.image, data?.cover, data?.poster, ...(Array.isArray(data?.images) ? data.images : [])];
  ids.push(...values.filter((value): value is string => typeof value === "string" && z.uuid().safeParse(value).success));
  await publishMedia(repo, ids);
}

async function writeItem(model: Delegate, name: Collection, input: CollectionInput, upsert = false) {
  checkName(name);
  const parsed = collectionInputSchema(name).safeParse(input, { error: z.locales.vi().localeError });
  if (!parsed.success) throw new CollectionError(parsed.error.issues.map(i => i.message).join("; "), 400);
  const value = parsed.data, slug = value.slug?.trim() || slugify(value.title.vi);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 200) throw new CollectionError("Đường dẫn không hợp lệ", 400);
  const before = value.id ? await model.get(value.id) : upsert ? await model.first({ where: { slug } }) : null;
  if (value.id && !before) throw missing();
  const conflict = upsert && !value.id ? before : await model.first({ where: { slug } });
  if (conflict && conflict.id !== before?.id) throw new CollectionError("Đường dẫn đã được dùng", 409);
  // A category must not become its own ancestor, including through an existing chain.
  if (name === "productCategory" && value.id) {
    let parent = value.columns.parentId;
    const seen = new Set([value.id]);
    while (typeof parent === "string") {
      if (seen.has(parent)) throw new CollectionError("Danh mục cha tạo vòng lặp", 400);
      seen.add(parent); parent = (await model.get(parent))?.parentId;
    }
  }
  const data = { ...value.columns, slug, title: value.title, data: value.data,
    status: value.status, publishedAt: value.status === "published" ? before?.publishedAt ?? new Date() : null };
  let id: string;
  if (before) { if (!(await model.update(before.id, data)).count) throw missing(); id = before.id; }
  else id = (await model.create({ ...data, order: await nextOrder(model) })).id;
  return { id, slug, published: before?.status === "published" || value.status === "published" };
}
export async function saveCollectionItem(db: Db | PlatformDb, tenantId: string, name: Collection, input: CollectionInput): Promise<{ id: string; slug: string }> {
  return transaction(db, tenantId, name, async (repo, model) => {
    const result = await writeItem(model, name, input);
    await publishItemMedia(repo, name, (await model.get(result.id))!);
    if (result.published) await invalidate(repo, tenantId, name);
    return { id: result.id, slug: result.slug };
  });
}
async function writeItems(repo: TenantRepo, model: Delegate, tenantId: string, inputs: CollectionInput[]) {
  let published = false;
  for (const input of inputs) {
    const result = await writeItem(model, "product", input, true);
    await publishItemMedia(repo, "product", (await model.get(result.id))!);
    published = result.published || published;
  }
  if (published) await invalidate(repo, tenantId, "product");
}
export async function importCollectionItems(db: Db | PlatformDb, tenantId: string, name: "product", inputs: CollectionInput[]) {
  if (inputs.length > 1000) throw new CollectionError("Chỉ có thể nhập tối đa 1000 dòng sản phẩm", 400);
  return transaction(db, tenantId, name, (repo, model) => writeItems(repo, model, tenantId, inputs), 60_000);
}
/** Re-read products and references in the same serializable transaction as the writes. */
export async function importProductCsv(db: Db | PlatformDb, tenantId: string, text: string, options: { bilingual: boolean }) {
  return transaction(db, tenantId, "product", async (repo, model) => {
    const [existing, categories, brands] = await Promise.all([model.list(), collectionRepository(repo, "productCategory").list(), collectionRepository(repo, "brand").list()]);
    const preview = previewProductCsv(text, existing, { categories, brands }, options);
    const errors = preview.rows.flatMap(row => row.errors.map(e => `Dòng ${row.line}, cột ${e.column}: ${e.message}`));
    if (errors.length) throw new CollectionError(errors.join("; "), 400);
    await writeItems(repo, model, tenantId, preview.inputs);
    return { count: preview.inputs.length };
  }, 60_000);
}
export async function duplicateCollectionItem(db: Db | PlatformDb, tenantId: string, name: Collection, id: string) {
  checkId(id);
  return transaction(db, tenantId, name, async (_repo, model) => {
    const original = await model.get(id); if (!original) throw missing();
    let slug = "";
    for (let n = 1; ; n++) {
      const suffix = `-ban-sao${n === 1 ? "" : `-${n}`}`;
      slug = `${original.slug.slice(0, 200 - suffix.length).replace(/-$/, "")}${suffix}`;
      if (!await model.first({ where: { slug } })) break;
    }
    const { id: _id, tenantId: _tenant, createdAt: _created, updatedAt: _updated, ...data } = original;
    return { id: (await model.create({ ...data, slug, status: "draft", publishedAt: null, order: await nextOrder(model) })).id };
  });
}
export async function deleteCollectionItem(db: Db | PlatformDb, tenantId: string, name: Collection, id: string) {
  checkId(id);
  try {
    await transaction(db, tenantId, name, async (repo, model) => {
      const before = await model.get(id); if (!before) throw missing();
      if (!(await model.delete(id)).count) throw missing();
      if (before.status === "published") await invalidate(repo, tenantId, name);
    });
  } catch (error) {
    if (error instanceof CollectionError && error.message === "Tham chiếu không hợp lệ hoặc khác website") {
      throw new CollectionError("Đang được dùng bởi sản phẩm, danh mục hoặc nội dung khác", 409);
    }
    throw error;
  }
}
export async function reorderCollection(db: Db | PlatformDb, tenantId: string, name: Collection, ids: string[]) {
  if (!z.array(z.uuid()).max(500).safeParse(ids).success) throw new CollectionError("Danh sách sắp xếp không hợp lệ", 400);
  await transaction(db, tenantId, name, async (repo, model) => {
    const rows = await model.list();
    const set = new Set(ids);
    if (ids.length !== rows.length || set.size !== rows.length || rows.some(r => !set.has(r.id))) throw new CollectionError("Danh sách sắp xếp phải chứa đủ bản ghi của website", 400);
    for (const [order, id] of ids.entries()) await model.update(id, { order });
    if (rows.some(r => r.status === "published")) await invalidate(repo, tenantId, name);
  });
}
