import assert from "node:assert/strict";
import { test } from "node:test";
import { migrateSectionRow } from "../sectionContent.ts";
import { forTenant, type DbClient } from "../repository.ts";
import { Prisma } from "../../generated/client.ts";
import { sectionRegistry } from "@solar/sections";

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

const tenantId = "019a1234-1234-7123-8123-123456789abc";
const rowId = "019a1234-1234-7123-8123-123456789abd";
type Stored = { type: string; schemaVersion: number; data: unknown; draftData: unknown };

function memoryRepo(initial: Stored, concurrent = false) {
  let stored = structuredClone(initial), reads = 0, writes = 0, conflicts = 0;
  const payloads: Record<string, unknown>[] = [];
  let release!: () => void;
  const bothRead = new Promise<void>((resolve) => { release = resolve; });
  const db = { sectionContent: {
    async findFirst() {
      const snapshot = structuredClone(stored);
      if (concurrent && ++reads <= 2) {
        if (reads === 2) release();
        await bothRead;
      }
      return snapshot;
    },
    async updateMany({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) {
      // Model Postgres equality predicates so the second migration write must retry.
      if (where.schemaVersion !== undefined && (where.schemaVersion !== stored.schemaVersion
        || !["data", "draftData"].every((field) => {
          const value = (where[field] as { equals: unknown }).equals;
          return value === Prisma.AnyNull ? stored[field as "data" | "draftData"] == null
            : JSON.stringify(value) === JSON.stringify(stored[field as "data" | "draftData"]);
        }))) { conflicts++; return { count: 0 }; }
      writes++;
      payloads.push(data);
      stored = { ...stored, ...data };
      if (stored.draftData === Prisma.DbNull) stored.draftData = null;
      return { count: 1 };
    },
  } } as unknown as DbClient;
  return { repo: forTenant(db, tenantId), row: () => stored, payloads, counts: () => ({ reads, writes, conflicts }) };
}

for (const version of [1, 3]) {
  test(`concurrent published/draft saves retain both updates from v${version}`, async () => {
    const memory = memoryRepo({ type: "shorts", schemaVersion: version, data: { title: "Old published" }, draftData: { title: "Old draft" } }, true);
    await Promise.all([
      memory.repo.sectionContent.update(rowId, { data: { title: "New published", channels: [] } }),
      memory.repo.sectionContent.update(rowId, { draftData: { title: "New draft", channels: [] } }),
    ]);
    assert.equal((memory.row().data as Record<string, unknown>).title, "New published");
    assert.equal((memory.row().draftData as Record<string, unknown>).title, "New draft");
    assert.equal(memory.row().schemaVersion, 3);
    if (version === 1) assert.deepEqual(memory.counts(), { reads: 3, writes: 2, conflicts: 1 });
    else {
      assert.equal(Object.hasOwn(memory.payloads[0], "draftData"), false);
      assert.equal(Object.hasOwn(memory.payloads[1], "data"), false);
    }
  });
}

test("section type is immutable at runtime, including metadata-only updates", async () => {
  const memory = memoryRepo({ type: "shorts", schemaVersion: 3, data: {}, draftData: null });
  for (const input of [{ type: "hero", schemaVersion: 2, data: sectionRegistry.getType("hero")!.defaults }, { type: { set: "hero" } }]) {
    await assert.rejects(memory.repo.sectionContent.update(rowId, input as never), /type.*immutable/);
  }
  assert.equal(memory.counts().writes, 0);
});

test("valid replacements repair either or both corrupt legacy fields; retained corrupt data still fails", async () => {
  const defaults = sectionRegistry.getType("shorts")!.defaults as Prisma.InputJsonValue;
  for (const row of [
    { data: null, draftData: null }, { data: null, draftData: { title: "Kept draft" } },
    { data: { title: "Kept published" }, draftData: "broken" },
  ]) {
    const memory = memoryRepo({ type: "shorts", schemaVersion: 1, ...row });
    const input = { ...(row.data === null ? { data: defaults } : {}), ...(typeof row.draftData === "string" || row.draftData === null ? { draftData: defaults } : {}) };
    await memory.repo.sectionContent.update(rowId, input);
    assert.equal(memory.row().schemaVersion, 3);
    assert.deepEqual((memory.row().data as Record<string, unknown>).channels, []);
    assert.deepEqual((memory.row().draftData as Record<string, unknown>).channels, []);
  }
  const memory = memoryRepo({ type: "shorts", schemaVersion: 1, data: null, draftData: {} });
  await assert.rejects(memory.repo.sectionContent.update(rowId, { draftData: defaults }), /must be an object/);
  assert.equal(memory.counts().writes, 0);
});

test("published-only save migrates retained draft; DbNull deletes draft; future row keeps version and keys", async () => {
  const legacy = memoryRepo({ type: "shorts", schemaVersion: 1, data: {}, draftData: { custom: "draft" } });
  await legacy.repo.sectionContent.update(rowId, { data: { title: "Published", channels: [] } });
  assert.deepEqual(legacy.row().draftData, migrateSectionRow({ type: "shorts", schemaVersion: 1, data: {}, draftData: { custom: "draft" } }).draftData);
  await legacy.repo.sectionContent.update(rowId, { draftData: Prisma.DbNull });
  assert.equal(legacy.row().draftData, null);
  const future = memoryRepo({ type: "shorts", schemaVersion: 10, data: { futureKey: "published" }, draftData: { futureKey: "draft" } });
  await future.repo.sectionContent.update(rowId, { data: { title: "Updated", futureKey: "published" }, schemaVersion: 3 });
  assert.equal(future.row().schemaVersion, 10);
  assert.deepEqual(future.row().data, { title: "Updated", futureKey: "published" });
  assert.deepEqual(future.row().draftData, { futureKey: "draft" });
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
