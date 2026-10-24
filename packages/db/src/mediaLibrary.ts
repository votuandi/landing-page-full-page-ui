import { z } from "zod";
import { collectRefs, sectionRegistry } from "@solar/sections";
import { siteTag } from "@solar/cache";
import { kindOf } from "@solar/storage";
import type { Db, PlatformDb } from "./client.ts";
import type { TenantRepo } from "./repository.ts";
import { withTenantTransaction } from "./tenantTransaction.ts";
import { COLLECTIONS, collectionDefs } from "./collections.ts";
import { collectionRepository, collectionMediaIds } from "./collectionWrite.ts";
import { siteProfileMediaIds } from "./siteProfile.ts";
import { MediaError, mediaNameSchema, mediaVariantsSchema } from "./media.ts";
import { enqueueInvalidate } from "./invalidate.ts";

export type MediaUse = { kind: "section" | "collection" | "site"; label: string; href: string };
export class MediaInUseError extends MediaError {
  constructor(readonly uses: MediaUse[]) { super("Media đang được sử dụng. Xác nhận xóa để tiếp tục.", 409); }
}
const title = (value: unknown, fallback: string) => typeof value === "string" ? value : (value as { vi?: string } | null)?.vi || fallback;

/** Scan once for the whole grid, including unpublished references, always through a tenant repository. */
export async function mediaReferences(repo: TenantRepo, ids?: readonly string[]): Promise<Map<string, MediaUse[]>> {
  const selected = ids ? new Set(ids) : null, uses = new Map<string, MediaUse[]>();
  const add = (id: string, use: MediaUse) => {
    if (!z.uuid().safeParse(id).success || selected && !selected.has(id)) return;
    uses.set(id, [...uses.get(id) ?? [], use]);
  };
  const [pages, contents, sites, collections] = await Promise.all([
    repo.page.list(), repo.sectionContent.list({ where: { removedAt: null } }), repo.site.list(),
    Promise.all(COLLECTIONS.map(async name => ({ name, rows: await collectionRepository(repo, name).list() }))),
  ]);
  const pageById = new Map(pages.map(page => [page.id, page]));
  for (const content of contents) {
    const def = sectionRegistry.getType(content.type);
    if (!def) continue;
    const live = collectRefs(def.schema, content.data).media, draft = collectRefs(def.schema, content.draftData).media;
    const page = pageById.get(content.pageId);
    const label = `Trang ${title(page?.title, page?.slug || "Trang chủ")} › ${content.type}`;
    for (const id of new Set([...live, ...draft])) add(id, { kind: "section", label: `${label}${live.includes(id) ? "" : " (bản nháp)"}`, href: `/trang/${content.pageId}` });
  }
  for (const { name, rows } of collections) for (const row of rows) {
    for (const id of collectionMediaIds(name, row)) add(id, { kind: "collection", label: `${collectionDefs[name].label.vi} › ${title(row.title, row.slug)}`, href: `/noi-dung/${collectionDefs[name].path}/${row.id}` });
  }
  for (const site of sites) for (const id of siteProfileMediaIds(site.profile)) add(id, { kind: "site", label: `Website ${site.name}`, href: "/cai-dat" });
  return uses;
}

export const mediaFocalSchema = z.strictObject({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) });
const altText = z.string().trim().max(250);
const metaSchema = z.strictObject({
  alt: z.strictObject({ vi: altText, en: altText.optional() }),
  focal: mediaFocalSchema.optional(), name: mediaNameSchema.optional(),
});
const missing = () => new MediaError("Không tìm thấy media.", 404);
export async function updateMediaMeta(db: Db | PlatformDb, tenantId: string, id: string, raw: unknown) {
  const parsed = metaSchema.safeParse(raw);
  if (!parsed.success) throw new MediaError("Alt tối đa 250 ký tự; điểm lấy nét phải nằm trong khoảng 0 đến 1.");
  return withTenantTransaction(db, tenantId, async repo => {
    const row = await repo.media.get(id);
    if (!row) throw missing();
    const { alt, ...rest } = parsed.data;
    if (kindOf(row.mime) === "image" && !alt.vi) throw new MediaError("Ảnh cần mô tả alt tiếng Việt để hỗ trợ SEO và trình đọc màn hình.");
    const data = { ...rest, alt: { vi: alt.vi, ...(alt.en ? { en: alt.en } : {}) } };
    if (!(await repo.media.update(id, data)).count) throw missing();
    await repo.auditLog.create({ actorType: "site_user", action: "media.updated", entity: "Media", entityId: id, data });
  });
}

export async function deleteMedia(db: Db | PlatformDb, tenantId: string, id: string, { confirm }: { confirm: boolean }) {
  try {
    return await withTenantTransaction(db, tenantId, async repo => {
      const row = await repo.media.get(id);
      if (!row) throw missing();
      if (row.status !== "ready" && row.status !== "failed") throw new MediaError("Tệp đang xử lý. Vui lòng hủy lượt tải lên hoặc thử lại sau.", 409);
      const uses = (await mediaReferences(repo, [id])).get(id) ?? [];
      if (uses.length && !confirm) throw new MediaInUseError(uses);
      const foreignKeys = [["project", "coverMediaId"], ["post", "coverMediaId"], ["story", "posterMediaId"], ["brand", "logoMediaId"]] as const;
      for (const [name, column] of foreignKeys) {
        const model = collectionRepository(repo, name);
        for (const item of await model.list({ where: { [column]: id } })) await model.update(item.id, { [column]: null });
      }
      if (!(await repo.media.delete(id)).count) throw missing();
      await repo.auditLog.create({ actorType: "site_user", action: "media.deleted", entity: "Media", entityId: id, data: { uses } });
      if (row.visibility === "public") await enqueueInvalidate(repo, [siteTag(tenantId)]);
      return { keys: [...new Set([row.key, ...(mediaVariantsSchema.safeParse(row.variants).data ?? []).map(variant => variant.key)])] };
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && ["P2003", "P2034"].includes(String(error.code))) throw new MediaError("Dữ liệu vừa thay đổi. Vui lòng tải lại và xác nhận lại.", 409);
    throw error;
  }
}
