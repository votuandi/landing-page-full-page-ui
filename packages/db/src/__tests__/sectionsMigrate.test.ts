import assert from "node:assert/strict";
import fs, { mkdtemp, readFile, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runSectionsMigrate } from "../sectionsMigrate.ts";
import type { Db } from "../client.ts";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("database runner batches two tenants and continues past corrupt rows and snapshots", async () => {
  const tenants = ["019a1234-1234-7123-8123-123456789abc", "019a1234-1234-7123-8123-123456789abd"];
  const sections = Array.from({ length: 102 }, (_, index) => ({
    id: `019a1234-1234-7123-8123-${String(index).padStart(12, "0")}`,
    tenantId: tenants[index === 101 ? 1 : 0], type: "shorts", schemaVersion: 1,
    data: { custom: `published-${index}` }, draftData: { custom: `draft-${index}` },
  }));
  const bad = { ...sections[0], id: "019a1234-1234-7123-8123-000000000999", data: null };
  const snapshots = [
    { id: "019a1234-1234-7123-8123-000000001000", tenantId: tenants[0], snapshot: { contents: [{ type: "shorts", schemaVersion: 1, data: {} }] } },
    { id: "019a1234-1234-7123-8123-000000001001", tenantId: tenants[1], snapshot: { contents: [null] } },
  ];
  function delegate(rows: Record<string, unknown>[]) {
    return {
      async findMany({ where, take }: { where: { tenantId: string; id?: { gt: string } }; take: number }) {
        assert.ok(tenants.includes(where.tenantId), "all content reads require tenant scope");
        return rows.filter((row) => row.tenantId === where.tenantId && (!where.id || String(row.id) > where.id.gt))
          .sort((a, b) => String(a.id).localeCompare(String(b.id))).slice(0, take);
      },
      async findFirst({ where }: { where: { tenantId: string; id: string } }) {
        return rows.find((row) => row.tenantId === where.tenantId && row.id === where.id) ?? null;
      },
      async updateMany({ where, data }: { where: { tenantId: string; id: string }; data: Record<string, unknown> }) {
        const row = rows.find((row) => row.tenantId === where.tenantId && row.id === where.id);
        if (row) Object.assign(row, data);
        return { count: row ? 1 : 0 };
      },
    };
  }
  const db = {
    tenant: { async findMany() { return tenants.map((id) => ({ id })); } },
    sectionContent: delegate([...sections, bad]), pageVersion: delegate(snapshots),
  } as unknown as Db;
  const before = JSON.stringify({ sections, bad, snapshots });
  const log: string[] = [];
  assert.deepEqual(await runSectionsMigrate({ db, dryRun: true, log: (line) => log.push(line) }), { changed: 103, errors: 2 });
  assert.equal(JSON.stringify({ sections, bad, snapshots }), before);
  assert.ok(log.some((line) => line.includes(bad.id)));
  assert.ok(log.some((line) => line.includes(snapshots[1].id)));
  assert.deepEqual(await runSectionsMigrate({ db, log: () => {} }), { changed: 103, errors: 2 });
  assert.ok(sections.every((row) => row.schemaVersion === 3));
  assert.equal(bad.schemaVersion, 1);
  assert.deepEqual(await runSectionsMigrate({ db, log: () => {} }), { changed: 0, errors: 2 });
});

test("backup file dry-run, migration and second run; single and array snapshots", async () => {
  const dir = await mkdtemp(join(tmpdir(), "sections-migrate-"));
  try {
    const snapshot = { sections: [{ id: "video" }], contents: [
      { type: "shorts", schemaVersion: 1, data: { custom: "keep" } },
      { type: "shorts", schemaVersion: 1, data: { custom: "another section" } },
    ] };
    for (const initial of [snapshot, [snapshot, { contents: [{ type: "unknown", data: {} }] }]]) {
      const file = join(dir, "backup.json");
      const original = JSON.stringify(initial);
      await writeFile(file, original);
      const log: string[] = [];
      const dry = await runSectionsMigrate({ file, dryRun: true, log: (line) => log.push(line) });
      assert.deepEqual(dry, { changed: 1, errors: 0 });
      assert.ok(log.some((line) => line.endsWith("shorts v1→v3 · 1")), "summary counts snapshot records, not individual contents");
      assert.equal(await readFile(file, "utf8"), original);
      assert.deepEqual(await runSectionsMigrate({ file, log: () => {} }), { changed: 1, errors: 0 });
      const migrated = JSON.parse(await readFile(file, "utf8"));
      const first = Array.isArray(migrated) ? migrated[0] : migrated;
      assert.deepEqual(first.contents[0].data.channels, []);
      assert.equal(first.contents[0].data.custom, "keep");
      assert.deepEqual(first.sections, snapshot.sections);
      assert.equal(first.contents[0].schemaVersion, 3);
      assert.deepEqual(await runSectionsMigrate({ file, log: () => {} }), { changed: 0, errors: 0 });
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("corrupt backup reports errors and leaves original bytes intact", async () => {
  const dir = await mkdtemp(join(tmpdir(), "sections-migrate-"));
  try {
    const file = join(dir, "backup.json");
    const original = JSON.stringify([{ contents: [{ type: "shorts", schemaVersion: 1, data: {} }] }, { contents: [{ type: "shorts", schemaVersion: 1, data: null }] }]);
    await writeFile(file, original);
    const log: string[] = [];
    const result = await runSectionsMigrate({ file, log: (line) => log.push(line) });
    assert.equal(result.errors, 1);
    assert.ok(log.some((line) => line.includes("snapshot 1")));
    assert.equal(await readFile(file, "utf8"), original);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("CLI accepts backup mode without DATABASE_URL and exits nonzero on migration/argument errors", async () => {
  const dir = await mkdtemp(join(tmpdir(), "sections-migrate-"));
  try {
    const file = join(dir, "backup.json");
    await writeFile(file, JSON.stringify({ contents: [{ type: "shorts", schemaVersion: 1, data: {} }] }));
    const { DATABASE_URL: _url, ...env } = process.env;
    const cli = fileURLToPath(new URL("../../scripts/sections-migrate.ts", import.meta.url));
    const run = (...args: string[]) => spawnSync(process.execPath, ["--import", "tsx", cli, ...args], { env, encoding: "utf8" });
    const dry = run("--file", file, "--dry-run");
    assert.equal(dry.status, 0, dry.stderr);
    assert.match(dry.stdout, /DRY RUN: 1 changed records, 0 errors/);
    assert.equal(JSON.parse(await readFile(file, "utf8")).contents[0].schemaVersion, 1);
    const migrated = run("--file", file);
    assert.equal(migrated.status, 0, migrated.stderr);
    assert.equal(JSON.parse(await readFile(file, "utf8")).contents[0].schemaVersion, 3);
    assert.match(run("--file", file).stdout, /0 changed records, 0 errors/);
    await writeFile(file, JSON.stringify({ contents: [{ type: "shorts", schemaVersion: 1, data: null }] }));
    assert.equal(run("--file", file).status, 1);
    assert.equal(run("--unknown").status, 1);
    assert.equal(run("--file").status, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("runner paginates PageVersion, skips future versions and continues after database write failures", async () => {
  const tenantId = "019a1234-1234-7123-8123-123456789abc";
  const id = (index: number) => `019a1234-1234-7123-8123-${String(index).padStart(12, "0")}`;
  const snapshot = (schemaVersion = 1) => ({ contents: [{ type: "shorts", schemaVersion, data: { futureKey: "keep" } }] });
  const sections = [
    { id: id(0), tenantId, type: "shorts", schemaVersion: 1, data: {}, draftData: null },
    { id: id(1), tenantId, type: "shorts", schemaVersion: 10, data: { futureKey: "keep" }, draftData: null },
    { id: id(2), tenantId, type: "shorts", schemaVersion: 1, data: {}, draftData: null },
  ];
  const versions = Array.from({ length: 103 }, (_, index) => ({ id: id(index), tenantId, snapshot: snapshot(index === 101 ? 10 : 1) }));
  const cursors: { table: string; after?: string; size: number }[] = [], writes: string[] = [];
  const future = JSON.stringify([sections[1], versions[101]]);
  function delegate(table: string, rows: Record<string, unknown>[]) {
    return {
      async findMany({ where, take, orderBy }: { where: { tenantId: string; id?: { gt: string } }; take: number; orderBy: unknown }) {
        assert.equal(where.tenantId, tenantId);
        assert.deepEqual(orderBy, { id: "asc" });
        assert.equal(take, 100);
        const batch = rows.filter((row) => !where.id || String(row.id) > where.id.gt).slice(0, take);
        cursors.push({ table, after: where.id?.gt, size: batch.length });
        return batch;
      },
      async findFirst({ where }: { where: { tenantId: string; id: string } }) {
        assert.equal(where.tenantId, tenantId);
        return rows.find((row) => row.id === where.id);
      },
      async updateMany({ where, data }: { where: { tenantId: string; id: string }; data: Record<string, unknown> }) {
        assert.equal(where.tenantId, tenantId);
        writes.push(`${table}:${where.id}`);
        if (where.id === id(0)) throw new Error("database write rejected");
        Object.assign(rows.find((row) => row.id === where.id)!, data);
        return { count: 1 };
      },
    };
  }
  const db = {
    tenant: { async findMany() { return [{ id: tenantId }]; } },
    sectionContent: delegate("SectionContent", sections), pageVersion: delegate("PageVersion", versions),
  } as unknown as Db;
  const logs: string[] = [];
  assert.deepEqual(await runSectionsMigrate({ db, log: (line) => logs.push(line) }), { changed: 102, errors: 2 });
  assert.deepEqual(cursors.filter((cursor) => cursor.table === "PageVersion"), [
    { table: "PageVersion", after: undefined, size: 100 },
    { table: "PageVersion", after: id(99), size: 3 },
    { table: "PageVersion", after: id(102), size: 0 },
  ]);
  assert.equal(writes.length, 104);
  assert.ok(!writes.includes(`SectionContent:${id(1)}`));
  assert.ok(!writes.includes(`PageVersion:${id(101)}`));
  assert.equal(JSON.stringify([sections[1], versions[101]]), future);
  assert.equal(sections[2].schemaVersion, 3);
  assert.equal(versions[102].snapshot.contents[0].schemaVersion, 3);
  for (const table of ["SectionContent", "PageVersion"]) assert.ok(logs.some((line) => line.includes(`ERROR tenant ${tenantId} ${table} ${id(0)}: database write rejected`)));
  assert.equal(logs.at(-1), "MIGRATE: 102 changed records, 2 errors");
});

test("empty database or empty tenant returns zero and never writes", async () => {
  for (const tenants of [[], [{ id: "019a1234-1234-7123-8123-123456789abc" }]]) {
    let reads = 0;
    const delegate = { async findMany() { reads++; return []; }, async updateMany() { assert.fail("empty database cannot write"); } };
    const db = { tenant: { async findMany() { return tenants; } }, sectionContent: delegate, pageVersion: delegate } as unknown as Db;
    const logs: string[] = [];
    assert.deepEqual(await runSectionsMigrate({ db, log: (line) => logs.push(line) }), { changed: 0, errors: 0 });
    assert.equal(reads, tenants.length * 2);
    assert.deepEqual(logs, ["MIGRATE: 0 changed records, 0 errors"]);
  }
});

test("backup syntax/read/write/rename failures preserve original, clean temp and exit CLI 1", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "sections-migrate-failures-"));
  const file = join(dir, "backup.json");
  const fixture = fileURLToPath(new URL("./fixtures/backup-failure.cjs", import.meta.url));
  const cli = fileURLToPath(new URL("../../scripts/sections-migrate.ts", import.meta.url));
  try {
    for (const failure of ["syntax", "read", "write", "rename"] as const) {
      await t.test(failure, async (t) => {
        const original = failure === "syntax" ? '{"contents":' : JSON.stringify({ contents: [{ type: "shorts", schemaVersion: 1, data: {} }] });
        await writeFile(file, original);
        const write = fs.writeFile;
        if (failure === "read") t.mock.method(fs, "readFile", async () => { throw new Error("injected read EACCES"); });
        if (failure === "write") t.mock.method(fs, "writeFile", async (...args: Parameters<typeof fs.writeFile>) => {
          await write(...args); throw new Error("injected write ENOSPC after partial file");
        });
        if (failure === "rename") t.mock.method(fs, "rename", async () => { throw new Error("injected rename EACCES"); });
        const logs: string[] = [];
        const result = await runSectionsMigrate({ file, log: (line) => logs.push(line) });
        t.mock.restoreAll();
        assert.equal(result.errors, 1);
        assert.ok(logs.some((line) => line.includes(`ERROR ${file}:`)));
        assert.equal(await readFile(file, "utf8"), original);
        assert.deepEqual(await readdir(dir), ["backup.json"]);
        const child = spawnSync(process.execPath, ["--require", fixture, "--import", "tsx", cli, "--file", file], {
          env: { ...process.env, BACKUP_TEST_FAILURE: failure, BACKUP_TEST_FILE: file }, encoding: "utf8",
        });
        assert.equal(child.status, 1, child.stderr + child.stdout);
        assert.match(child.stdout, /1 errors/);
        assert.equal(await readFile(file, "utf8"), original);
        assert.deepEqual(await readdir(dir), ["backup.json"]);
      });
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});
