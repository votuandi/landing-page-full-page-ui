import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { effectivePermissions, type Session } from "@solar/auth";
import { createAction, createRoute } from "../lib/action.ts";

const owner: Session = { id: "s", tenantId: "a", realm: "site", audience: "admin", role: "owner", kind: "user", mustChangePassword: false,
  expiresAt: new Date(), permissions: effectivePermissions({ role: "owner", audience: "admin" }) };
test("action parses untrusted input and checks permissions before running the handler", async () => {
  let ran = false;
  const handler = async () => { ran = true; return { ok: true }; };
  const denied = createAction(async () => ({ tenantId: "a", slug: "a", session: { ...owner, permissions: new Set() } }))("users.manage", z.object({ name: z.string() }), handler);
  assert.equal(denied.permission, "users.manage");
  assert.equal((await denied({}, new FormData())).status, 400);
  const form = new FormData(); form.set("name", "value"); form.set("tenantId", "evil");
  assert.equal((await denied({}, form)).status, 403); assert.equal(ran, false);
  const guest = createAction(async () => ({ tenantId: "a", slug: "a", session: null }));
  assert.equal((await guest("dashboard.view", z.object({}), handler)({}, form)).status, 401);
  const publicAction = guest("public", z.object({}), handler);
  assert.equal((await publicAction({}, form)).ok, true); assert.equal(ran, true);
  const forced = createAction(async () => ({ tenantId: "a", slug: "a", session: { ...owner, mustChangePassword: true } }));
  ran = false;
  for (const permission of ["dashboard.view", "account.totp", "public"] as const) assert.equal((await forced(permission, z.object({}), handler)({}, form)).status, 403);
  assert.equal(ran, false);
});
test("action rejects forged previous state and hides internal errors; route returns actual HTTP denials", async () => {
  const make = createAction(async () => ({ tenantId: "a", slug: "a", session: owner }));
  const action = make("dashboard.view", z.object({}), async () => { throw new Error("database credentials here"); });
  assert.deepEqual(await action({ ok: true }, new FormData()), { ok: false, status: 500, error: "Không thể thực hiện lúc này. Vui lòng thử lại." });
  const route = createRoute(async () => ({ tenantId: "b", slug: "b", session: owner }))("dashboard.view", async () => Response.json({ private: true }));
  const response = await route(new Request("http://b.admin.solar.localhost/api/session"));
  assert.equal(response.status, 401); assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal((await response.text()).includes("private"), false);
});
