import assert from "node:assert/strict";
import { test } from "node:test";
import { effectivePermissions, type Session } from "@solar/auth";
import { authorize } from "../lib/gate.ts";

const session = (role: "owner" | "editor" | "client" = "owner", forced = false): Session => ({
  id: "s", accountId: "u", tenantId: "a", realm: "site", audience: "admin", kind: "user", role,
  mustChangePassword: forced, expiresAt: new Date(Date.now() + 1000), permissions: effectivePermissions({ role, audience: "admin" }),
});
test("admin gates reject absent, foreign-tenant, platform and storefront sessions", () => {
  for (const value of [null, { ...session(), tenantId: "b" }, { ...session(), realm: "platform" as const }, { ...session(), audience: "storefront" as const }, session("client")]) {
    assert.throws(() => authorize(value, "a", "dashboard.view"), { status: 401 });
  }
});
test("forced password grants only password and logout; roles and live deny policy apply", () => {
  assert.ok(authorize(session("owner", true), "a", "account.password"));
  assert.ok(authorize(session("owner", true), "a", "session"));
  for (const perm of ["dashboard.view", "account.totp", "domains.manage"] as const) assert.throws(() => authorize(session("owner", true), "a", perm), { status: 403 });
  for (const perm of ["domains.manage", "billing.view", "users.view"] as const) assert.throws(() => authorize(session("editor"), "a", perm), { status: 403 });
  assert.throws(() => authorize({ ...session(), permissions: new Set() }, "a", "dashboard.view"), { status: 403 });
});
