import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { sectionRegistry } from "@solar/sections";
import { demoBackup } from "./tenantBackup.fixture.ts";
import { parseTenantBackup } from "../tenantBackup.ts";
import { backupMediaReferenceIds, snapshotMediaIds } from "../mediaRetention.ts";
import { loadBackupMediaProtection } from "../mediaOrphans.ts";

test("backup refs protect content but not every media inventory row; corrupt backup aborts", async () => {
  const root = await mkdtemp(join(tmpdir(), "solar-backups-"));
  try {
    const raw = demoBackup(), id = randomUUID(), unused = randomUUID();
    const bundle = parseTenantBackup({ ...raw, site: { ...raw.site, profile: { brand: { favicon: id } } }, media: [id, unused].map(id => ({ id, key: `private/${raw.source.tenantId}/${id}.png`, driver: "local", mime: "image/png", size: 1, status: "ready", visibility: "private", createdAt: raw.exportedAt })) });
    const refs = backupMediaReferenceIds(bundle);
    assert.ok(refs.has(id)); assert.ok(!refs.has(unused));
    await writeFile(join(root, "valid.json"), JSON.stringify(bundle));
    assert.ok((await loadBackupMediaProtection(root)).get(raw.source.tenantId)?.has(id));
    await writeFile(join(root, "corrupt.json"), "{");
    await assert.rejects(loadBackupMediaProtection(root), /Bản sao lưu/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("backup collector protects draftData, inline sections, draftSections and historical snapshots", () => {
  const bundle = parseTenantBackup(demoBackup()), ids = Array.from({ length: 4 }, () => randomUUID());
  const hero = (id: string) => ({ type: "hero", data: { ...sectionRegistry.types.hero.defaults, image: { id } } });
  bundle.sectionContents[0] = { ...bundle.sectionContents[0], type: "hero", draftData: hero(ids[0]).data };
  bundle.pages[0].sections = [hero(ids[1])]; bundle.pages[0].draftSections = [hero(ids[2])];
  bundle.pageVersions[0].snapshot = { contents: [hero(ids[3])] };
  const refs = backupMediaReferenceIds(bundle);
  for (const id of ids) assert.ok(refs.has(id));
});

test("legacy empty and descriptor-only snapshots have no media; corrupt contents fail closed", () => {
  for (const value of [{}, { sections: [], contents: [{ sectionId: "old" }] }]) assert.deepEqual(snapshotMediaIds(value), []);
  assert.throws(() => snapshotMediaIds({ contents: "corrupt" }), /snapshot/);
});
