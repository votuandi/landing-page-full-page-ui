import assert from "node:assert/strict";
import test from "node:test";
import { createIconHandler } from "../icon";
import { resizeIcon } from "../iconRuntime";
import sharp from "sharp";

const tenantId = "00000000-0000-4000-8000-000000000001", siteId = "00000000-0000-4000-8000-000000000002", id = "00000000-0000-4000-8000-000000000003";
function setup(patch: object = {}) {
  let reads = 0;
  const deps = {
    loadSite: async () => ({ profile: { brand: { favicon: id } } }),
    media: async (tenant: string, mediaId: string) => { assert.equal(tenant, tenantId); assert.equal(mediaId, id); return { tenantId, status: "ready", visibility: "public", key: `tenants/${tenantId}/icon.png`, driver: "local" as const }; },
    storage: { get: async () => { reads++; return new Uint8Array([1, 2]); } },
    resize: async (_bytes: Uint8Array, size: number) => new Uint8Array([size]),
    ...patch,
  };
  return { handle: createIconHandler(deps), reads: () => reads };
}

test("icon resizes to requested 64 and 180 with public PNG headers", async () => {
  const s = setup();
  for (const size of [64, 180] as const) {
    const response = await s.handle(tenantId, siteId, size);
    assert.equal(response.status, 200); assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal(response.headers.get("cache-control"), "public, max-age=86400");
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([size]));
  }
});

test("icon selects row driver", async () => {
  let selected = "";
  const f = setup({ media: async () => ({ tenantId, status: "ready", visibility: "public", key: `tenants/${tenantId}/icon.png`, driver: "s3" }),
    storage: (kind: string) => { selected = kind; return { get: async () => new Uint8Array([1]) }; } });
  assert.equal((await f.handle(tenantId, siteId, 64)).status, 200); assert.equal(selected, "s3");
});

test("icon real sharp converts a rectangular JPEG to 64 and 180 PNG and corrupt bytes fall back", async () => {
  const bytes = await sharp({ create: { width: 24, height: 32, channels: 3, background: "red" } }).jpeg().toBuffer();
  const s = setup({ storage: { get: async () => bytes }, resize: resizeIcon });
  for (const size of [64, 180] as const) {
    const response = await s.handle(tenantId, siteId, size);
    assert.equal(response.status, 200);
    const meta = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    assert.equal(meta.format, "png"); assert.equal(meta.width, size); assert.equal(meta.height, size);
  }
  assert.equal((await setup({ resize: resizeIcon }).handle(tenantId, siteId, 64)).status, 307);
});

test("icon rejects foreign/private/prefix and non-ready without storage access", async () => {
  const good = { tenantId, status: "ready", visibility: "public", key: `tenants/${tenantId}/icon.png` };
  for (const media of [null, { ...good, tenantId: siteId }, { ...good, visibility: "private" }, { ...good, status: "quarantine" }, { ...good, key: `tenants/${siteId}/icon.png` }, { ...good, key: `private/${tenantId}/icon.png` }]) {
    const s = setup({ media: async () => media });
    const response = await s.handle(tenantId, siteId, 64);
    assert.equal(response.status, 307); assert.equal(response.headers.get("location"), "/favicon.svg");
    assert.equal(response.headers.get("cache-control"), "no-store"); assert.equal(s.reads(), 0);
  }
});

test("icon missing site/favicon/storage or corrupt image falls back without 500", async () => {
  for (const patch of [
    { loadSite: async () => null }, { loadSite: async () => ({ profile: { brand: {} } }) },
    { storage: { get: async () => null } }, { storage: { get: async () => { throw new Error("storage"); } } },
    { resize: async () => { throw new Error("corrupt image"); } },
  ]) assert.equal((await setup(patch).handle(tenantId, siteId, 64)).status, 307);
});
