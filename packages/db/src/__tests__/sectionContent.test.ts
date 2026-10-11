import assert from "node:assert/strict";
import { test } from "node:test";
import { migrateSectionRow } from "../sectionContent.ts";
import { forTenant, type DbClient } from "../repository.ts";

test("lazy row migration upgrades published data and draft together without writing", () => {
  const row = { id: "row", type: "shorts", schemaVersion: 1, data: { title: "Published" }, draftData: { title: "Draft" } };
  const before = structuredClone(row);
  const result = migrateSectionRow(row);
  assert.equal(result.schemaVersion, 3);
  assert.equal(result.changed, true);
  assert.equal((result.data as Record<string, unknown>).title, "Published");
  assert.deepEqual((result.draftData as Record<string, unknown>).channels, []);
  assert.deepEqual(row, before);
  assert.deepEqual(migrateSectionRow(result), { ...result, changed: false });
});

test("null draft stays null; future rows stay intact; unknown types fail", () => {
  const row = { type: "shorts", schemaVersion: 1, data: {}, draftData: null };
  assert.equal(migrateSectionRow(row).draftData, null);
  const future = { ...row, schemaVersion: 10 };
  assert.deepEqual(migrateSectionRow(future), { ...future, changed: false });
  assert.throws(() => migrateSectionRow({ ...row, type: "unknown" }), /unknown/);
});

test("saving only draft upgrades published data and defaults create to current version", async () => {
  let stored = { type: "shorts", schemaVersion: 1, data: { title: "Published" }, draftData: null as unknown };
  const db = { sectionContent: {
    async findFirst() { return stored; },
    async updateMany({ data }: { data: typeof stored }) { stored = { ...stored, ...data }; return { count: 1 }; },
    async create({ data }: { data: typeof stored }) { return data; },
  } } as unknown as DbClient;
  const repo = forTenant(db, "019a1234-1234-7123-8123-123456789abc");
  await repo.sectionContent.update("019a1234-1234-7123-8123-123456789abd", { draftData: { title: "Saved draft", channels: [] } });
  assert.equal(stored.schemaVersion, 3);
  assert.deepEqual((stored.data as Record<string, unknown>).channels, []);
  assert.equal((stored.draftData as Record<string, unknown>).title, "Saved draft");
  const created = await repo.sectionContent.create({ siteId: "site", pageId: "page", sectionId: "video", type: "shorts", data: {} });
  assert.equal(created.schemaVersion, 3);
});
