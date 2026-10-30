import assert from "node:assert/strict";
import { test } from "node:test";
import { inviteFormSchema, inviteSchema, roleSchema } from "../lib/staffInput.ts";
import { deviceLabel, staffDate, roleLabels, statusLabels } from "../lib/staffLabels.ts";

test("invite input", () => {
  const name = "[DỮ LIỆU MẪU]";
  for (const [identifier, expected] of [[" A@B.vn ", { kind: "email", value: "a@b.vn" }], ["+84 901 234 567", { kind: "phone", value: "0901234567" }], ["0901 234 567", { kind: "phone", value: "0901234567" }]]) {
    assert.deepEqual(inviteSchema.parse({ identifier, name, role: "editor" }).loginId, expected);
  }
  for (const input of [{ identifier: "username" }, { name: " " }, { name: "a".repeat(101) }, { role: "owner" }, { role: "client" }]) {
    assert.equal(inviteSchema.safeParse({ identifier: "a@b.vn", name, role: "staff", ...input }).success, false);
  }
  for (const role of ["admin", "editor", "staff", "viewer"]) assert.equal(roleSchema.parse(role), role);
  for (const [input, message] of [[{ identifier: "khong-hop-le" }, /số điện thoại/], [{ identifier: "" }, /số điện thoại/], [{ name: " " }, /họ và tên/], [{ name: "a".repeat(101) }, /100 ký tự/], [{ role: "owner" }, /Vai trò/]] as const) {
    const base = { identifier: "a@b.vn", name, role: "staff" };
    assert.match(inviteSchema.safeParse({ ...base, ...input }).error!.issues[0].message, message);
  }
  assert.equal(inviteFormSchema.safeParse({ identifier: "khong-hop-le", name: "", role: "owner" }).success, true);
});

test("device labels", () => {
  assert.equal(deviceLabel(null), "Không rõ trình duyệt");
  assert.equal(deviceLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0"), "Edge trên Windows");
  assert.equal(deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"), "Safari trên iOS");
  assert.equal(deviceLabel("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36"), "Chrome trên Android");
  assert.equal(deviceLabel("curl/8.0"), "Trình duyệt khác");
});

test("row labels", () => {
  assert.equal(staffDate(null), "Chưa đăng nhập");
  assert.match(staffDate("2026-10-30T00:00:00Z"), /30\/10\/2026/);
  assert.equal(roleLabels.owner, "Chủ sở hữu");
  assert.equal(statusLabels.invited, "Chờ nhận lời mời");
});
