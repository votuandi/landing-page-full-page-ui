import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
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
