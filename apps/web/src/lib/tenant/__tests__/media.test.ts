import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import type { TenantRepo } from "@solar/db";
import { createMediaResolver } from "../media";

const tenantId = randomUUID(), id = randomUUID();
const key = `tenants/${tenantId}/2026/10/${id}.mp4`;
const poster = { key: key.replace(/\.mp4$/, "-w640.webp"), format: "webp", width: 360, height: 640, size: 100 };
const source = { provider: "file", idOrSrc: id };
const row = { id, tenantId, key, status: "ready", visibility: "public", mime: "video/mp4", variants: [poster] };
const storage = { publicUrl: (key: string) => `https://cdn.example/${key}` };
function setup(rows = [row], allowed = true) {
  const queries: unknown[] = [];
  const repo = { media: { list: async (args: unknown) => { queries.push(args); return rows; } } } as unknown as TenantRepo;
  const resolve = createMediaResolver(tenantId, storage, () => allowed, repo);
  return { queries, resolve: (data: unknown) => resolve({ data }) };
}

test("resolver resolves public video once, poster falls back to generated, keeps explicit static poster", async () => {
  for (const posterId of [id, randomUUID(), "/images/poster.jpg"]) {
    const f = setup();
    const data = { items: [{ id: "a", source, poster: { id: posterId, alt: { vi: "Poster" } } }, { id: "b", source }] };
    const resolved = await f.resolve(data) as typeof data;
    assert.equal(resolved.items[0].source.idOrSrc, storage.publicUrl(key));
    assert.equal(resolved.items[0].poster?.id, posterId.startsWith("/") ? posterId : storage.publicUrl(poster.key));
    assert.equal(data.items[0].source.idOrSrc, id, "does not mutate cached config");
    assert.equal(f.queries.length, 1);
    assert.deepEqual(f.queries[0], { where: { id: { in: [id] }, status: "ready", visibility: "public", mime: { startsWith: "video/" } } });
  }
});

test("resolver ignores foreign/private/non-video, quarantine and malformed public keys", async () => {
  for (const change of [{ tenantId: randomUUID() }, { visibility: "private" }, { status: "quarantine" }, { mime: "image/webp" },
    { key: `tenants/${randomUUID()}/x.mp4` }, { key: `private/${tenantId}/x.mp4` }, { key: `tenants/${tenantId}/../x.mp4` }]) {
    const f = setup([{ ...row, ...change }]);
    assert.deepEqual(await f.resolve({ items: [{ source }] }), { items: [] });
  }
  assert.deepEqual(await setup([row], false).resolve({ items: [{ source }] }), { items: [] }, "render checks videoUpload entitlement");
});

test("unresolved file sources dropped from required arrays; optional video removed and content survives", async () => {
  const f = setup([]);
  const data = { items: [{ title: "required", source }, { title: "project", video: source }], video: source, title: "about" };
  assert.deepEqual(await f.resolve(data), { items: [{ title: "project" }], title: "about" });
  assert.deepEqual(await f.resolve({ title: "about-story", video: { poster: { id }, source } }), { title: "about-story" });
  for (const bad of ["not-a-uuid", "http://evil.test/video.mp4"]) assert.deepEqual(await f.resolve({ items: [{ source: { provider: "file", idOrSrc: bad } }] }), { items: [] });
});

test("no uuid no query; media resolver keeps static story sources and embeds", async () => {
  const f = setup();
  const data = { items: [{ source: { provider: "file", idOrSrc: "/videos/shorts/a.mp4" } }, { source: { provider: "youtube", idOrSrc: "abcdefgh" } }], image: { id } };
  assert.deepEqual(await f.resolve(data), data); assert.equal(f.queries.length, 0);
  const staticResolve = createMediaResolver("static-test", storage, () => true);
  assert.deepEqual(await staticResolve({ data }), data, "no repository initialization without UUIDs");
});

test("poster fallback never exposes foreign variants", async () => {
  for (const variantKey of [`private/${tenantId}/x.webp`, `tenants/${randomUUID()}/x.webp`, `tenants/${tenantId}/../x.webp`]) {
    const f = setup([{ ...row, variants: [{ ...poster, key: variantKey }] }]);
    const result = await f.resolve({ items: [{ source, poster: { id } }] });
    assert.doesNotMatch(JSON.stringify(result), /private\/|x.webp/);
  }
});
