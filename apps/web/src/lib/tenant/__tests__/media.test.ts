import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import type { TenantRepo } from "@solar/db";
import { createMediaResolver } from "../media";
import { storageFor } from "@solar/storage";
import { variantKey, VARIANT_WIDTHS, VARIANT_FORMATS } from "@solar/storage";
import { buildDemo } from "../../../../../../packages/db/prisma/seed-data";
import { loadPreset, presets } from "@solar/presets";

const tenantId = randomUUID(), id = randomUUID();
const key = `tenants/${tenantId}/2026/10/${id}.mp4`;
const poster = { key: key.replace(/\.mp4$/, "-w640.webp"), format: "webp", width: 360, height: 640, size: 100 };
const source = { provider: "file", idOrSrc: id };
const row = { id, tenantId, key, status: "ready", visibility: "public", mime: "video/mp4", variants: [poster] };
const storage = { publicUrl: (key: string) => `https://cdn.example/${key}` };

test("row driver selects migrated URL and lazy configuration leaves static pages independent of S3", async () => {
  const repo = { media: { list: async () => [{ ...row, driver: "s3" }] } } as unknown as TenantRepo;
  const resolver = createMediaResolver(tenantId, kind => storageFor(kind, { STORAGE_LOCAL_ROOT: ".media", MEDIA_PUBLIC_BASE: "https://local.example", MEDIA_PUBLIC_BASE_S3: "https://s3.example", S3_BUCKET: "test" }), () => true, repo);
  const result = await resolver({ data: { source } }) as { source: { idOrSrc: string } };
  assert.equal(result.source.idOrSrc, `https://s3.example/${key}`);
  const missingConfig = createMediaResolver(tenantId, kind => storageFor(kind, { STORAGE_LOCAL_ROOT: ".media", MEDIA_PUBLIC_BASE: "https://local.example" }), () => true, repo);
  assert.deepEqual(await missingConfig({ data: { title: "Static" } }), { title: "Static" });
  await assert.rejects(missingConfig({ data: { source } }), /S3_BUCKET/);
});
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
    assert.equal(f.queries.length, posterId.startsWith("/") ? 1 : 2);
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

const imageKey = key.replace(/\.mp4$/, ".jpg");
const imageRow = { ...row, key: imageKey, mime: "image/jpeg", driver: "local" as const, focal: { x: 0.5, y: 0.5 },
  variants: VARIANT_WIDTHS.flatMap(width => VARIANT_FORMATS.map(format => ({ key: variantKey(imageKey, width, format), format, width, height: width / 2, size: 100 }))) };
const ref = { id, alt: { vi: "Ảnh" } };
function imageSetup(rows: unknown[] = [imageRow]) {
  const queries: unknown[] = [];
  const repo = { media: { list: async (args: unknown) => { queries.push(args); return rows; } } } as unknown as TenantRepo;
  const resolve = createMediaResolver(tenantId, storage, () => false, repo);
  return { queries, resolve: (data: unknown) => resolve({ data }) };
}
test("image ref resolves to variant url; case-insensitive id; repeated collection refs query once", async () => {
  const f = imageSetup();
  const data = { image: ref, items: [{ image: { ...ref, id: id.toUpperCase() } }] };
  const result = await f.resolve(data) as typeof data;
  const expected = `${storage.publicUrl(variantKey(imageKey, 1920, "webp"))}#m=640,1280,1920&f=0.5,0.5`;
  assert.equal(result.image.id, expected); assert.equal(result.items[0].image.id, expected);
  assert.equal(data.image.id, id); assert.equal(f.queries.length, 1);
  assert.deepEqual(f.queries[0], { where: { id: { in: [id] }, status: "ready", visibility: "public", mime: { startsWith: "image/" } } });
});
test("focal precedence", async () => {
  const f = imageSetup();
  const result = await f.resolve({ image: { ...ref, focal: { x: 0.2, y: 0.8 } }, other: ref }) as { image: typeof ref; other: typeof ref };
  assert.match(result.image.id, /&f=0.2,0.8$/); assert.match(result.other.id, /&f=0.5,0.5$/);
  for (const focal of [null, {}, { x: 2, y: 0.5 }]) {
    const fallback = await imageSetup([{ ...imageRow, focal }]).resolve(ref) as typeof ref;
    assert.doesNotMatch(fallback.id, /&f=/);
  }
});
test("missing variants falls back to original", async () => {
  for (const variants of [[], null, imageRow.variants.slice(1), [...imageRow.variants.slice(1), imageRow.variants[1]],
    imageRow.variants.map((v, i) => i ? v : { ...v, width: 0 }),
    imageRow.variants.map((v, i) => i ? v : { ...v, width: 600 }),
    imageRow.variants.map(v => v.key.includes("w640") ? { ...v, width: 1280 } : v),
    imageRow.variants.map(v => v.key.includes("w1920") ? { ...v, width: 500 } : v)]) {
    assert.deepEqual(await imageSetup([{ ...imageRow, variants }]).resolve(ref), { ...ref, id: storage.publicUrl(imageKey) });
  }
  const key = `tenants/${tenantId}/original`;
  assert.deepEqual(await imageSetup([{ ...imageRow, key }]).resolve(ref), { ...ref, id: storage.publicUrl(key) });
});
test("foreign or non-ready image stays placeholder; unsafe variants never exposed", async () => {
  for (const change of [{ tenantId: randomUUID() }, { visibility: "private" }, { status: "quarantine" }, { status: "failed" }, { mime: "video/mp4" },
    { key: `tenants/${randomUUID()}/x.jpg` }, { key: `private/${tenantId}/x.jpg` }, { key: `quarantine/${tenantId}/x.jpg` }, { key: `tenants/${tenantId}/../x.jpg` }]) {
    assert.deepEqual(await imageSetup([{ ...imageRow, ...change }]).resolve(ref), ref);
  }
  for (const badKey of [`private/${tenantId}/x-w640.avif`, `tenants/${randomUUID()}/x-w640.avif`, `tenants/${tenantId}/different-w640.avif`]) {
    const variants = imageRow.variants.map((v, i) => i ? v : { ...v, key: badKey });
    assert.deepEqual(await imageSetup([{ ...imageRow, variants }]).resolve(ref), { ...ref, id: storage.publicUrl(imageKey) });
  }
});
test("uses row driver", async () => {
  const repo = { media: { list: async () => [{ ...imageRow, driver: "s3" }] } } as unknown as TenantRepo;
  const resolve = createMediaResolver(tenantId, kind => ({ publicUrl: key => `https://${kind}.example/${key}` }), () => false, repo);
  assert.match((await resolve({ data: ref }) as typeof ref).id, /^https:\/\/s3.example\//);
});
test("resolved image poster takes precedence over video poster fallback", async () => {
  const posterId = randomUUID();
  const repo = { media: { list: async () => [row, { ...imageRow, id: posterId }] } } as unknown as TenantRepo;
  const resolve = createMediaResolver(tenantId, storage, () => true, repo);
  const result = await resolve({ data: { source, poster: { ...ref, id: posterId } } }) as { poster: typeof ref };
  assert.match(result.poster.id, /-w1920.webp#m=/);
});
test("static refs untouched; no query without uuid", async () => {
  const f = imageSetup();
  for (const theme of ["t15", "t12"] as const) {
    const data = JSON.parse(JSON.stringify(buildDemo(theme)));
    assert.deepEqual(await f.resolve(data), data, theme);
  }
  for (const preset of presets) {
    const data = loadPreset(preset.id).page;
    assert.deepEqual(await f.resolve(data), data, preset.id);
  }
  assert.equal(f.queries.length, 0);
});
