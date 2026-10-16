import assert from "node:assert/strict";
import test from "node:test";
import { effectivePermissions, PERMISSIONS, PERMISSION_GROUPS, PERMISSION_LABELS, ROLE_PERMISSIONS } from "../permissions.ts";

test("roles are explicit, client has no admin permissions and storefront is isolated", () => {
  assert.equal(Object.keys(PERMISSION_LABELS).length, PERMISSIONS.length);
  assert.equal(effectivePermissions({ role: "client", audience: "admin" }).size, 0);
  assert.equal(ROLE_PERMISSIONS.admin.includes("users.transferOwner"), false);
  assert.equal(ROLE_PERMISSIONS.editor.includes("leads.manage"), false);
  for (const role of ["owner", "admin", "editor", "staff", "viewer", "client"] as const) {
    assert.deepEqual([...effectivePermissions({ role, audience: "storefront" })], ["storefront.account", "storefront.cart", "storefront.booking"]);
  }
});
test("ghost cannot change security; policy deny can only subtract, including groups", () => {
  const ghost = effectivePermissions({ role: "viewer", audience: "admin", kind: "ghost" });
  for (const permission of PERMISSION_GROUPS["account.security"]) assert.equal(ghost.has(permission), false);
  assert.equal(ghost.has("pages.edit"), true);
  const denied = effectivePermissions({ role: "owner", audience: "admin", policy: { deny: ["account.security", "pages.publish", "unknown"], allow: ["unknown"] } });
  assert.equal(denied.has("pages.publish"), false);
  assert.equal(denied.has("account.password"), false);
  assert.equal(denied.has("pages.edit"), true);
  assert.equal(effectivePermissions({ role: "viewer", audience: "admin", policy: { allow: ["users.manage"] } }).has("users.manage"), false);
});
