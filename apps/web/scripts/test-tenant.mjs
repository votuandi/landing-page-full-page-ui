import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

// Run ESM Prisma source via tsx; keep existing CommonJS fixture tests unchanged.
const folder = "src/lib/tenant/__tests__";
const tests = readdirSync(folder).filter((name) => name.endsWith(".test.ts")).sort();
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...tests.map((name) => `${folder}/${name}`)], { stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
