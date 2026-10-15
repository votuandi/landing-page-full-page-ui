import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

// Node 20 on Windows does not expand test globs.
const folder = "src/__tests__";
const tests = readdirSync(folder).filter((name) => name.endsWith(".test.ts")).sort();
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-concurrency=1", ...tests.map((name) => `${folder}/${name}`)], { stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
