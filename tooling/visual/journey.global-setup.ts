import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

// E14-S02: one tenant per preset (journey-t08 … journey-t15), upserted so tenant/site ids stay stable while a reused
// server still caches host → tenant. Leads from earlier runs stay; the spec matches its own lead by id.
export default function globalSetup() {
  execFileSync(process.execPath, ["--import", "tsx", "scripts/journey-fixture.ts", "setup"], {
    cwd: resolve(__dirname, "../../apps/admin"), encoding: "utf8", timeout: 180_000, stdio: ["ignore", "pipe", "inherit"],
  });
}
