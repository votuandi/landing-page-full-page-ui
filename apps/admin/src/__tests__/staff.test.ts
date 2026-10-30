import assert from "node:assert/strict";
import { test } from "node:test";
import { inviteSchema, roleSchema } from "../lib/staffInput.ts";
import { staffDate, roleLabels, statusLabels } from "../lib/staffLabels.ts";

test("invite input", () => {
  const name = "[DỮ LIỆU MẪU]";
  for (const [identifier, expected] of [[" A@B.vn ", { kind: "email", value: "a@b.vn" }], ["+84 901 234 567", { kind: "phone", value: "0901234567" }], ["0901 234 567", { kind: "phone", value: "0901234567" }]]) {
    assert.deepEqual(inviteSchema.parse({ identifier, name, role: "editor" }).loginId, expected);
  }
  for (const input of [{ identifier: "username" }, { name: " " }, { name: "a".repeat(101) }, { role: "owner" }, { role: "client" }]) {
    assert.equal(inviteSchema.safeParse({ identifier: "a@b.vn", name, role: "staff", ...input }).success, false);
  }
  for (const role of ["admin", "editor", "staff", "viewer"]) assert.equal(roleSchema.parse(role), role);
});

test("row labels", () => {
  assert.equal(staffDate(null), "Chưa đăng nhập");
  assert.match(staffDate("2026-10-30T00:00:00Z"), /30\/10\/2026/);
  assert.equal(roleLabels.owner, "Chủ sở hữu");
  assert.equal(statusLabels.invited, "Chờ nhận lời mời");
});
