import assert from "node:assert/strict";
import test from "node:test";
import { effectivePermissions, type Session, type Role } from "@solar/auth";
import { createRoute } from "../lib/action.ts";
import { createBackupHandler } from "../lib/tenantBackup.ts";

const tenantId = "e7100000-0000-4000-8000-000000000001";
function setup(role: Role, options: { otherTenant?: boolean; ghost?: boolean } = {}) {
  let reads = 0, audits = 0;
  const session: Session = { id: "s", accountId: tenantId, tenantId: options.otherTenant ? "e7100000-0000-4000-8000-000000000002" : tenantId,
    realm: "site", audience: "admin", kind: options.ghost ? "ghost" : "user", role, expiresAt: new Date(Date.now() + 10000), mustChangePassword: false,
    permissions: effectivePermissions({ role, kind: options.ghost ? "ghost" : "user", audience: "admin" }) };
  const handler = createBackupHandler({
    export: async id => { assert.equal(id, tenantId); reads++; return { format: "solar-tenant-backup", version: 1 }; },
    audit: async (id, actor) => { assert.equal(id, tenantId); assert.equal(actor.id, session.id); audits++; },
  });
  return { download: createRoute(async () => ({ tenantId, slug: "demo", session }))("site.backup", handler), reads: () => reads, audits: () => audits };
}
test("backup response is private, no-store and attachment; owner and ghost are allowed", async () => {
  for (const s of [setup("owner"), setup("viewer", { ghost: true })]) {
    const response = await s.download(new Request("https://demo/api/sao-luu"));
    assert.equal(response.status, 200); assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.match(response.headers.get("Content-Disposition")!, /^attachment; filename="demo-backup-\d{4}-\d{2}-\d{2}\.json"$/);
    assert.match(response.headers.get("Content-Type")!, /application\/json/);
    assert.equal((await response.json()).format, "solar-tenant-backup"); assert.equal(s.reads(), 1); assert.equal(s.audits(), 1);
  }
});
test("backup forbids admin/editor/staff/viewer/client and cross-tenant sessions before reads", async () => {
  for (const s of [setup("admin"), setup("editor"), setup("staff"), setup("viewer"), setup("client"), setup("owner", { otherTenant: true })]) {
    const response = await s.download(new Request("https://demo/api/sao-luu?tenantId=other"));
    assert.ok([401, 403].includes(response.status)); assert.equal(s.reads(), 0); assert.equal(s.audits(), 0);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  }
});
