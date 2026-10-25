import assert from "node:assert/strict";
import test from "node:test";
import { runMediaOrphans } from "../handlers/mediaOrphans.ts";

test("orphans log list before deleting objects using row driver; dry-run does not delete", async () => {
  for (const dryRun of [false, true]) {
    const events: string[] = [];
    const row = { tenantId: "tenant", id: "id", key: "private/tenant/a", driver: "s3" as const, keys: ["private/tenant/a"], orphanedAt: new Date() };
    await runMediaOrphans({ dryRun, sweep: async options => { events.push(options.dryRun ? "preview" : "commit"); return [row]; }, log: () => events.push("log"), storage: kind => { assert.equal(kind, "s3"); return { delete: async () => { events.push("delete"); } }; } });
    assert.deepEqual(events, dryRun ? ["preview", "log"] : ["preview", "log", "commit", "delete"]);
  }
});
