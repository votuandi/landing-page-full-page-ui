import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { parseTenantBackup, remapBackup, TenantBackupError } from "../tenantBackup.ts";
import { demoBackup } from "./tenantBackup.fixture.ts";

test("rejects foreign or newer bundles", () => {
  for (const input of ["{", {}, { ...demoBackup(), version: 2 }, { ...demoBackup(), format: "foreign" }, { ...demoBackup(), site: {} }, { ...demoBackup(), siteUser: [] }]) {
    assert.throws(() => parseTenantBackup(input), (e: unknown) => e instanceof TenantBackupError && e.status === 400 && /Bản sao lưu/.test(e.message));
  }
});

test("remaps ids and media keys in nested JSON", () => {
  const raw = demoBackup(), target = randomUUID();
  const oldId = raw.collections.product[0].id, key = `tenants/${raw.source.tenantId}/2026/10/a.webp`;
  const bundle = parseTenantBackup({ ...raw, site: { ...raw.site, profile: { nested: { ids: [oldId], image: `https://cdn.test/${key}`, key, unchanged: `prefix-${oldId}` } } } });
  const before = structuredClone(bundle), result = remapBackup(bundle, target);
  const nested = (result.site.profile as { nested: { ids: string[]; image: string; key: string; unchanged: string } }).nested;
  assert.notEqual(result.collections.product[0].id, oldId);
  assert.equal(nested.ids[0], result.collections.product[0].id);
  assert.equal(nested.key, `tenants/${target}/2026/10/a.webp`);
  assert.equal(nested.image, `https://cdn.test/${nested.key}`);
  assert.equal(nested.unchanged, `prefix-${oldId}`);
  assert.deepEqual(bundle, before, "pure remapping does not mutate source");
});

test("rejects duplicate ids and media keys outside the source tenant", () => {
  const raw = demoBackup(); raw.pages[0].id = raw.site.id;
  assert.throws(() => parseTenantBackup(raw), TenantBackupError);
  const media = { id: randomUUID(), key: `tenants/${randomUUID()}/a.webp`, driver: "local", status: "ready", visibility: "public", mime: "image/webp", size: 1, createdAt: raw.exportedAt };
  assert.throws(() => parseTenantBackup({ ...demoBackup(), media: [media] }), TenantBackupError);
});
