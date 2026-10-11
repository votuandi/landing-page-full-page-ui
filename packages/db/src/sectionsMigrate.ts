import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { migrateSnapshot, sectionRegistry } from "@solar/sections";
import { Prisma, type SectionContent, type PageVersion } from "../generated/client.ts";
import type { Db } from "./client.ts";
import { forTenant } from "./repository.ts";
import { migrateSectionRow } from "./sectionContent.ts";

type Options = { db?: Db; dryRun?: boolean; file?: string; log?: (line: string) => void };

export async function runSectionsMigrate({ db, dryRun = false, file, log = console.log }: Options) {
  const result = { changed: 0, errors: 0 };
  const groups = new Map<string, number>();
  const record = (tenant: string, table: string, type: string, from: number, to: number) => {
    const key = `${tenant} · ${table} · ${type} v${from}→v${to}`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
  };
  const failure = (id: string, error: unknown) => {
    result.errors++;
    log(`ERROR ${id}: ${error instanceof Error ? error.message : String(error)}`);
  };
  function recordSnapshot(tenant: string, table: string, snapshot: unknown) {
    const { contents } = snapshot as { contents: { type: string; schemaVersion: number }[] };
    const counted = new Set<string>();
    for (const entry of contents) {
      const def = sectionRegistry.getType(entry.type);
      const key = `${entry.type}:${entry.schemaVersion}`;
      if (def && entry.schemaVersion < def.schemaVersion && !counted.has(key)) {
        counted.add(key);
        record(tenant, table, entry.type, entry.schemaVersion, def.schemaVersion);
      }
    }
  }

  if (file) {
    try {
      const original: unknown = JSON.parse(await fs.readFile(file, "utf8"));
      const snapshots = Array.isArray(original) ? original : [original];
      const migrated = snapshots.map((snapshot: unknown, index: number) => {
        try {
          const next = migrateSnapshot(snapshot);
          if (next.changed) { result.changed++; recordSnapshot(file, "backup", snapshot); }
          return next.snapshot;
        } catch (error) { failure(`${file} snapshot ${index}`, error); return snapshot; }
      });
      // A partially migrated backup is never written.
      if (!dryRun && result.changed && !result.errors) {
        const temp = `${file}.${randomUUID()}.tmp`;
        try {
          await fs.writeFile(temp, JSON.stringify(Array.isArray(original) ? migrated : migrated[0], null, 2) + "\n", { flag: "wx" });
          await fs.rename(temp, file);
        } finally { await fs.rm(temp, { force: true }); }
      }
    } catch (error) { failure(file, error); }
  } else {
    if (!db) throw new Error("Database client is required unless --file is used");
    const tenants = await db.tenant.findMany({ select: { id: true }, orderBy: { id: "asc" } });
    for (const tenant of tenants) {
      const repo = forTenant(db, tenant.id);
      let after: string | undefined;
      while (true) {
        const rows: SectionContent[] = await repo.sectionContent.list({ where: after ? { id: { gt: after } } : {}, orderBy: { id: "asc" }, take: 100 });
        if (!rows.length) break;
        for (const row of rows) {
          try {
            const next = migrateSectionRow(row);
            if (next.changed) {
              if (!dryRun) await repo.sectionContent.update(row.id, {
                schemaVersion: next.schemaVersion, data: next.data as Prisma.InputJsonValue,
                draftData: next.draftData == null ? Prisma.DbNull : next.draftData as Prisma.InputJsonValue,
              });
              result.changed++;
              record(tenant.id, "SectionContent", row.type, row.schemaVersion, next.schemaVersion);
            }
          } catch (error) { failure(`tenant ${tenant.id} SectionContent ${row.id}`, error); }
        }
        after = rows[rows.length - 1].id;
      }
      after = undefined;
      while (true) {
        const rows: PageVersion[] = await repo.pageVersion.list({ where: after ? { id: { gt: after } } : {}, orderBy: { id: "asc" }, take: 100 });
        if (!rows.length) break;
        for (const row of rows) {
          try {
            const next = migrateSnapshot(row.snapshot);
            if (next.changed) {
              if (!dryRun) await repo.pageVersion.update(row.id, { snapshot: next.snapshot as Prisma.InputJsonValue });
              result.changed++;
              recordSnapshot(tenant.id, "PageVersion", row.snapshot);
            }
          } catch (error) { failure(`tenant ${tenant.id} PageVersion ${row.id}`, error); }
        }
        after = rows[rows.length - 1].id;
      }
    }
  }
  for (const [key, count] of groups) log(`${key} · ${count}`);
  log(`${dryRun ? "DRY RUN" : "MIGRATE"}: ${result.changed} changed records, ${result.errors} errors`);
  return result;
}
