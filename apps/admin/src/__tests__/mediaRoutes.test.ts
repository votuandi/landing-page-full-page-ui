import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { effectivePermissions, type Session } from "@solar/auth";
import type { StorageDriver } from "@solar/storage";
import { createRoute } from "../lib/action.ts";
import { createMediaHandlers, type MediaStore } from "../lib/media.ts";
import { MediaInUseError } from "@solar/db";

const tenantId = randomUUID(), id = randomUUID(), base = "http://demo.admin.solar.localhost";
function setup(s3 = false, videoUpload = false) {
  const row = { id, tenantId, key: `quarantine/${tenantId}/${id}`, status: "quarantine", visibility: "private", mime: "image/png", size: 8, driver: s3 ? "s3" as const : "local" as const };
  const files = new Map<string, Uint8Array>(); const calls: string[] = [];
  const store: MediaStore = {
    get: async (tenant, key) => tenant === tenantId && key === id ? { ...row } : null,
    reserve: async () => { calls.push("reserve"); return { ...row }; },
    complete: async () => { calls.push("complete"); }, cancel: async () => { calls.push("cancel"); return { ...row }; },
    remove: async (_tenant, _id, options) => { calls.push(`remove:${options.confirm}`); return { keys: [row.key, `${row.key}-variant`] }; },
  };
  const storage: StorageDriver = { get: async key => files.get(key) ?? null, put: async (key, bytes) => { calls.push("put"); files.set(key, bytes); },
    delete: async key => { files.delete(key); }, head: async key => files.has(key) ? { size: files.get(key)!.length } : null,
    list: async function* () {}, publicUrl: () => { throw Error("private"); },
    ...(s3 ? { signedUploadUrl: async () => ({ url: "http://minio:9000/bucket/quarantine", headers: { "Content-Type": "image/png" } }) } : {}),
  };
  const handlers = createMediaHandlers({ store, storage: () => storage, canUploadVideo: async () => videoUpload });
  const owner: Session = { id: "session", tenantId, role: "owner", realm: "site", audience: "admin", kind: "user", mustChangePassword: false,
    expiresAt: new Date(Date.now() + 60_000), permissions: effectivePermissions({ role: "owner", audience: "admin" }) };
  const route = (session: Session | null = owner, tenant = tenantId) => createRoute(async () => ({ session, tenantId: tenant, slug: "demo" }));
  const request = (suffix = "", method = "GET", body?: string, origin = base) => new Request(`${base}/api/media/${id}${suffix}`, { method, headers: { Origin: origin, Host: new URL(base).host }, body });
  return { row, calls, files, handlers, route, owner, request };
}

test("video upload requires videoUpload before reservation or presign; images remain available", async () => {
  for (const s3 of [false, true]) for (const allowed of [false, true]) for (const mime of ["video/mp4", "video/quicktime", "video/webm", "image/png"]) {
    const f = setup(s3, allowed);
    const response = await f.route()("media.manage", f.handlers.reserve)(f.request("", "POST", JSON.stringify({ mime, size: 8 })));
    assert.equal(response.status, allowed || mime === "image/png" ? 201 : 403);
    assert.equal(f.calls.includes("reserve"), response.status === 201);
  }
});

test("media routes: reserve gives PUT target, complete requires a present bounded object", async () => {
  for (const s3 of [false, true]) {
    const f = setup(s3);
    const response = await f.route()("media.manage", f.handlers.reserve)(f.request("", "POST", JSON.stringify({ mime: "image/png", size: 8 })));
    assert.equal(response.status, 201);
    const result = await response.json(); assert.equal(result.upload.method, "PUT");
    assert.equal(result.upload.url, s3 ? "http://minio:9000/bucket/quarantine" : `/api/media/${id}/upload`);
    const complete = f.route()("media.manage", f.handlers.complete);
    assert.equal((await complete(f.request("/complete", "POST"))).status, 400);
    f.files.set(f.row.key, Buffer.alloc(9)); assert.equal((await complete(f.request("/complete", "POST"))).status, 413);
    f.files.set(f.row.key, Buffer.alloc(8)); assert.equal((await complete(f.request("/complete", "POST"))).status, 202);
    assert.ok(f.calls.includes("complete"));
  }
});

test("media routes: local body overflow cancels immediately without storing partial bytes; s3 rejects local upload", async () => {
  const f = setup(); let cancelled = false, pulled = 0;
  const stream = new ReadableStream({ pull(c) { pulled++; c.enqueue(Buffer.alloc(9)); }, cancel() { cancelled = true; } }, { highWaterMark: 0 });
  const request = new Request(`${base}/api/media/${id}/upload`, { method: "PUT", headers: { Origin: base, Host: new URL(base).host }, body: stream, duplex: "half" } as RequestInit);
  assert.equal((await f.route()("media.manage", f.handlers.upload)(request)).status, 413);
  assert.ok(cancelled); assert.equal(pulled, 1); assert.equal(f.files.size, 0);
  assert.equal((await f.route()("media.manage", f.handlers.upload)(f.request("/upload", "PUT", "12345678"))).status, 204);
  const s3 = setup(true);
  assert.equal((await s3.route()("media.manage", s3.handlers.upload)(s3.request("/upload", "PUT", "x"))).status, 409);
});

test("media routes: cross tenant, invalid id, quarantine and anonymous reads stay private", async () => {
  const f = setup(), read = f.route()("media.view", f.handlers.read);
  assert.equal((await read(f.request())).status, 404);
  f.row.status = "ready"; f.row.key = `private/${tenantId}/${id}.png`; f.files.set(f.row.key, Buffer.from("png"));
  const response = await read(f.request());
  assert.equal(response.status, 200); assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal((await read(new Request(`${base}/api/media/not-a-uuid`))).status, 404);
  const other = randomUUID();
  assert.equal((await f.route({ ...f.owner, tenantId: other }, other)("media.view", f.handlers.read)(f.request())).status, 404);
  assert.equal((await f.route(null)("media.view", f.handlers.read)(f.request())).status, 401);
});

test("media routes: permission and same-origin gate mutations before accessing storage", async () => {
  const f = setup();
  const viewer = { ...f.owner, role: "viewer" as const, permissions: effectivePermissions({ role: "viewer", audience: "admin" }) };
  assert.equal((await f.route(viewer)("media.manage", f.handlers.reserve)(f.request("", "POST", "{}"))).status, 403);
  assert.equal((await f.route()("media.manage", f.handlers.reserve)(f.request("", "POST", "{}", "https://evil.test"))).status, 403);
  assert.deepEqual(f.calls, []);
});

test("media routes: quarantine cancels; ready deletion commits before deleting objects", async () => {
  const f = setup(), remove = f.route()("media.manage", f.handlers.remove);
  f.files.set(f.row.key, Buffer.from("x"));
  assert.equal((await remove(f.request("", "DELETE"))).status, 204);
  assert.ok(f.calls.includes("cancel")); assert.equal(f.files.size, 0);
  f.row.status = "ready"; f.files.set(f.row.key, Buffer.from("x"));
  assert.equal((await remove(f.request("", "DELETE"))).status, 204);
  assert.ok(f.calls.includes("remove:false")); assert.equal(f.files.size, 0);
});

test("media library delete: confirm conflict returns uses, viewer denied, cross tenant, storage failure after commit", async () => {
  const f = setup(); f.row.status = "ready";
  const uses = [{ kind: "site" as const, label: "Website", href: "/cai-dat" }];
  const handlers = createMediaHandlers({
    store: { get: async () => f.row, reserve: async () => f.row, complete: async () => {}, cancel: async () => f.row,
      remove: async (_tenant, _id, { confirm }) => { if (!confirm) throw new MediaInUseError(uses); f.calls.push("committed"); return { keys: [f.row.key] }; } },
    storage: () => ({ delete: async () => { assert.ok(f.calls.includes("committed")); throw Error("internal key must not leak"); } }) as unknown as StorageDriver,
    canUploadVideo: async () => true,
  });
  const remove = f.route()("media.manage", handlers.remove);
  const conflict = await remove(f.request("", "DELETE")); assert.equal(conflict.status, 409); assert.deepEqual((await conflict.json()).uses, uses);
  const result = await remove(f.request("", "DELETE", JSON.stringify({ confirm: true }))); assert.equal(result.status, 204); assert.equal(await result.text(), "");
  assert.equal((await remove(f.request("", "DELETE", '{"confirm":"true"}'))).status, 400);
  const viewer = { ...f.owner, permissions: effectivePermissions({ role: "viewer", audience: "admin" }) };
  assert.equal((await f.route(viewer)("media.manage", handlers.remove)(f.request("", "DELETE"))).status, 403);
  const other = randomUUID();
  assert.equal((await f.route({ ...f.owner, tenantId: other }, other)("media.manage", handlers.remove)(f.request("", "DELETE"))).status, 404);
});
