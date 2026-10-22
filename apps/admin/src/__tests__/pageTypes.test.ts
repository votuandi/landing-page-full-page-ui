import assert from "node:assert/strict";
import test from "node:test";
import { effectivePermissions, type Session } from "@solar/auth";
import { createAction } from "../lib/action.ts";
import { createPageTypeHandler, pageTypeSchema } from "../lib/pageTypes.ts";

test("page catalog action rejects foreign tenant/site, viewer, invalid types and propagates expected catalog", async () => {
  const tenantId = "e7000000-0000-4000-8000-000000000001", siteId = "e7000000-0000-4000-8000-000000000002";
  const session = { id: "session", realm: "site", tenantId, audience: "admin", kind: "user", role: "owner", permissions: effectivePermissions({ role: "owner", audience: "admin" }), mustChangePassword: false, expiresAt: new Date(Date.now() + 10000) } as Session;
  let writes = 0;
  const handler = createPageTypeHandler({ tenant: async () => ({ tenantId, siteId }), set: async (_tenant, input) => {
    writes++; assert.deepEqual(input.pageTypes, ["home", "contact", "policy"]); assert.deepEqual(input.expected, ["home", "contact", "policy", "about"]);
  } });
  const form = () => { const f = new FormData(); Object.entries({ siteId, type: "about", enabled: "false", expected: JSON.stringify(["home", "contact", "policy", "about"]) }).forEach(([k,v]) => f.set(k,v)); return f; };
  const action = (current = session, tenant = tenantId) => createAction(async () => ({ tenantId: tenant, slug: "test", session: current }))("pages.structure", pageTypeSchema, handler);
  assert.equal((await action()({}, form())).ok, true);
  assert.equal((await action({ ...session, permissions: effectivePermissions({ role: "viewer", audience: "admin" }) })({}, form())).status, 403);
  assert.equal((await action({ ...session, tenantId: "foreign" }, "foreign")({}, form())).status, 404);
  const foreign = form(); foreign.set("siteId", "e7000000-0000-4000-8000-000000000003");
  assert.equal((await action()({}, foreign)).status, 404);
  for (const type of ["missing", "__proto__", ""]) { const f = form(); f.set("type", type); assert.equal((await action()({}, f)).status, 400); }
  assert.equal(writes, 1);
});
