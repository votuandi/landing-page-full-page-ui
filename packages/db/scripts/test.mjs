import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

// Node 20 on Windows does not expand test globs.
const tests = readdirSync("src/__tests__").filter((name) => name.endsWith(".test.ts")).sort();
// Each integration file now owns separate runtime/platform pools; bound workers avoid exhausting local/CI DB resources.
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-concurrency=2", ...tests.map((name) => `src/__tests__/${name}`)], { stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
