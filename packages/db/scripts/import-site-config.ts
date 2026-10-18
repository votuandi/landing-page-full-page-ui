import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createPlatformDb } from "../src/client.ts";
import { importSiteConfig, mapSiteConfig } from "../src/siteConfigImport.ts";

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { tenant: { type: "string" }, "dry-run": { type: "boolean" } } });
  if (positionals.length !== 1 || !values.tenant) throw new Error("Dùng: pnpm import:site-config <file> --tenant <slug> [--dry-run]");
  const imported = await import(pathToFileURL(resolve(process.env.INIT_CWD ?? process.cwd(), positionals[0])).href);
  const config = imported.siteConfig ?? imported.default;
  if (!config) throw new Error("File phải export siteConfig hoặc default");
  const mapped = mapSiteConfig(config);
  if (values["dry-run"]) console.log(JSON.stringify(mapped, null, 2));
  else {
    const db = createPlatformDb({ pool: 2 });
    try { await importSiteConfig(db, values.tenant, config); console.log(JSON.stringify({ imported: values.tenant, branches: mapped.branches.length, unmapped: mapped.unmapped }, null, 2)); }
    finally { await db.$disconnect(); }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Không thể nhập cấu hình");
  process.exitCode = 1;
}
