import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { storageFromEnv } from "@solar/storage";
import { createPlatformDb } from "../src/client.ts";
import { parseTenantBackup, restoreTenant } from "../src/tenantBackup.ts";

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { slug: { type: "string" }, plan: { type: "string" }, name: { type: "string" } } });
  if (positionals.length !== 1 || !values.slug || !values.plan) throw new Error("Dùng: pnpm tenant:restore <file> --slug <slug> --plan <id> [--name <tên>]");
  const bundle = parseTenantBackup(await readFile(resolve(process.env.INIT_CWD ?? process.cwd(), positionals[0]), "utf8"));
  const db = createPlatformDb({ pool: 2 });
  try { console.log(JSON.stringify(await restoreTenant(db, storageFromEnv(), bundle, { slug: values.slug, planId: values.plan as "basic" | "pro" | "premium", name: values.name }))); }
  finally { await db.$disconnect(); }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Không thể khôi phục website"); process.exitCode = 1;
}
