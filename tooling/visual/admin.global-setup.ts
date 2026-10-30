import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

// Once per run, not per worker: beforeAll/afterAll rerun after any failure, and recreating the tenants under a running
// admin server (no outbox worker to evict its cache) cascaded every later login into a hang (E11-S03, PR #69/#72).
export const adminFixture = (action: string) => execFileSync(process.execPath, ["--import", "tsx", "scripts/browser-fixture.ts", action], {
  cwd: resolve(__dirname, "../../apps/admin"), encoding: "utf8", timeout: 180_000, stdio: ["ignore", "pipe", "inherit"],
});

export default function globalSetup() {
  adminFixture("setup");
  return () => { adminFixture("cleanup"); };
}
