import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const tests = readdirSync("src/__tests__").filter(name => name.endsWith(".test.ts")).sort();
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-concurrency=1", ...tests.map(name => `src/__tests__/${name}`)], { stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
