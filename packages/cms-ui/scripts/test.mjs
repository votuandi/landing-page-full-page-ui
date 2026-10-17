import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const tests = readdirSync("src/__tests__").filter(name => /\.test\.tsx?$/.test(name)).sort();
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...tests.map(name => `src/__tests__/${name}`)], { stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
