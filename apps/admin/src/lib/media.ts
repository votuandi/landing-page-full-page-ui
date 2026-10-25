import { z } from "zod";
import { MediaError, MediaInUseError, uploadInput } from "@solar/db";
import { kindOf, defaultDriver as envDriver, type StorageKind, type StorageDriver } from "@solar/storage";
import { EntitlementError } from "@solar/plans";
import type { ActionContext } from "./action.ts";

export type UploadRow = { id: string; tenantId: string; key: string; status: string; visibility: string; mime: string; size: number; driver: "local" | "s3" };
export type MediaStore = {
  get(tenantId: string, id: string): Promise<UploadRow | null>;
  reserve(tenantId: string, input: { mime: string; size: number; name?: string }, driver: "local" | "s3"): Promise<UploadRow>;
  complete(tenantId: string, id: string): Promise<void>;
  cancel(tenantId: string, id: string): Promise<UploadRow>;
  remove(tenantId: string, id: string, options: { confirm: boolean }): Promise<{ keys: string[]; driver: StorageKind }>;
};
/** Object cleanup is best effort after the database transaction commits. Never log private keys. */
export async function removeMediaObjects(storage: StorageDriver, keys: readonly string[]) {
  for (const key of keys) {
    try { await storage.delete(key); }
    catch { console.error("Không thể dọn object media sau khi xóa bản ghi."); }
  }
}
const missing = () => new MediaError("Không tìm thấy media.", 404);
async function boundedBody(request: Request, max: number, allowEmpty = false): Promise<Uint8Array> {
  if (!request.body) throw new MediaError("Thiếu nội dung tệp.");
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > max) { await reader.cancel(); throw new MediaError("Tệp vượt dung lượng đã đặt chỗ.", 413); }
      chunks.push(value);
    }
    if (!size && !allowEmpty) throw new MediaError("Tệp rỗng.");
    return Buffer.concat(chunks, size);
  } finally { reader.releaseLock(); }
}

/** route() supplies the authenticated host tenant, permission and same-origin checks. */
export function createMediaHandlers({ store, storage, defaultDriver = envDriver, canUploadVideo }: { store: MediaStore; storage(kind: StorageKind): StorageDriver; defaultDriver?(): StorageKind; canUploadVideo(): Promise<boolean> }) {
  const guarded = (handler: (request: Request, context: ActionContext) => Promise<Response>) => async (request: Request, context: ActionContext) => {
    try { return await handler(request, context); }
    catch (error) {
      if (error instanceof MediaInUseError) return Response.json({ error: error.message, uses: error.uses }, { status: error.status });
      if (error instanceof MediaError || error instanceof EntitlementError) return Response.json({ error: error.message }, { status: error.status });
      throw error;
    }
  };
  const find = async (request: Request, context: ActionContext, status?: string) => {
    const id = new URL(request.url).pathname.split("/")[3];
    if (!z.uuid().safeParse(id).success) throw missing();
    const row = await store.get(context.tenantId, id);
    if (!row || row.tenantId !== context.tenantId || status && row.status !== status) throw missing();
    return row;
  };
  return {
    reserve: guarded(async (request, { tenantId }) => {
      let raw: unknown;
      try { raw = JSON.parse(Buffer.from(await boundedBody(request, 2048)).toString("utf8")); }
      catch (error) { if (error instanceof MediaError) throw error; throw new MediaError("Thông tin tệp không hợp lệ."); }
      const input = uploadInput(raw);
      if (kindOf(input.mime) === "video" && !await canUploadVideo()) throw new EntitlementError("videoUpload", 403, "Gói dịch vụ hiện tại không có tính năng Video tự host.");
      const row = await store.reserve(tenantId, input, defaultDriver());
      try {
        const driver = storage(row.driver);
        const upload = driver.signedUploadUrl ? await driver.signedUploadUrl(row.key, { contentType: row.mime, contentLength: row.size, expiresIn: 900 })
          : { url: `/api/media/${row.id}/upload`, headers: { "Content-Type": row.mime } };
        return Response.json({ id: row.id, upload: { method: "PUT", ...upload } }, { status: 201 });
      } catch (error) { await store.cancel(tenantId, row.id); throw error; }
    }),
    upload: guarded(async (request, context) => {
      const row = await find(request, context, "quarantine");
      const driver = storage(row.driver);
      if (driver.signedUploadUrl) throw new MediaError("Tệp phải tải trực tiếp lên kho lưu trữ.", 409);
      if (row.driver !== "local" || !row.key.startsWith(`quarantine/${context.tenantId}/`)) throw new MediaError("Vùng lưu trữ không phù hợp.", 409);
      const body = await boundedBody(request, row.size);
      await driver.put(row.key, body, { contentType: row.mime, cacheControl: "private, no-store" });
      return new Response(null, { status: 204 });
    }),
    complete: guarded(async (request, context) => {
      const row = await find(request, context, "quarantine");
      const meta = await storage(row.driver).head(row.key);
      if (!meta || meta.size <= 0) throw new MediaError("Tệp chưa được tải lên.");
      if (meta.size > row.size) throw new MediaError("Tệp vượt dung lượng đã đặt chỗ.", 413);
      await store.complete(context.tenantId, row.id);
      return Response.json({ id: row.id, status: "quarantine" }, { status: 202 });
    }),
    remove: guarded(async (request, context) => {
      const row = await find(request, context);
      if (row.status === "quarantine") {
        await storage(row.driver).delete(row.key);
        await store.cancel(context.tenantId, row.id);
      } else {
        let raw: unknown = {};
        const bytes = await boundedOptionalDeleteBody(request);
        try { if (bytes.length) raw = JSON.parse(bytes); } catch { throw new MediaError("Xác nhận xóa không hợp lệ."); }
        const parsed = z.strictObject({ confirm: z.boolean().default(false) }).safeParse(raw);
        if (!parsed.success) throw new MediaError("Xác nhận xóa không hợp lệ.");
        const { keys, driver } = await store.remove(context.tenantId, row.id, parsed.data);
        await removeMediaObjects(storage(driver), keys);
      }
      return new Response(null, { status: 204 });
    }),
    read: guarded(async (request, context) => {
      const row = await find(request, context, "ready");
      if (!["private", "tenants"].some(prefix => row.key.startsWith(`${prefix}/${context.tenantId}/`))) throw missing();
      const body = await storage(row.driver).get(row.key);
      if (!body) throw missing();
      return new Response(Buffer.from(body), { headers: {
        "Content-Type": row.mime, "Content-Length": String(body.byteLength), "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store", "Content-Disposition": row.mime === "application/pdf" ? "attachment" : "inline",
      } });
    }),
  };
}

async function boundedOptionalDeleteBody(request: Request): Promise<string> {
  if (!request.body) return "";
  // Next.js passes an empty stream (not null) for a body-less DELETE.
  return Buffer.from(await boundedBody(request, 2048, true)).toString("utf8");
}
