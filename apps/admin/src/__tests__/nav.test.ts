import assert from "node:assert/strict";
import { test } from "node:test";
import { effectivePermissions, type Permission } from "@solar/auth";
import { canUse, type EntitlementSubject } from "@solar/plans";
import { adminNav } from "../lib/nav.ts";

const permissions = effectivePermissions({ role: "owner", audience: "admin" });
const subject: EntitlementSubject = { planId: "pro", addons: [], status: "active", createdAt: new Date("2026-01-01") };
const can = canUse(subject);
const links = (nav: ReturnType<typeof adminNav>) => nav.flatMap(group => group.items);

test("owner navigation contains all story screens in order and the account group", () => {
  const nav = adminNav({ permissions, can });
  assert.deepEqual(links(nav).map(item => item.href), ["/", "/trang", "/noi-dung", "/media", "/lead", "/giao-dien", "/cai-dat", "/cai-dat/kenh-nhan-lead", "/ten-mien", "/email", "/nhan-vien", "/goi", "/doi-mat-khau", "/tai-khoan/bao-mat"]);
  assert.equal(nav[1].label, "Tài khoản của tôi");
});

test("editor cannot see domains, billing or staff; tenant policy removes denied items", () => {
  const editor = effectivePermissions({ role: "editor", audience: "admin", policy: { deny: ["media.view"] } });
  const hrefs = links(adminNav({ permissions: editor, can })).map(item => item.href);
  for (const href of ["/ten-mien", "/email", "/goi", "/nhan-vien", "/media", "/cai-dat"]) assert.ok(!hrefs.includes(href), href);
  assert.ok(hrefs.includes("/trang"));
});

test("basic plan hides lead inbox even when the owner has permission", () => {
  const nav = adminNav({ permissions, can: canUse({ ...subject, planId: "basic" }) });
  assert.ok(!links(nav).some(item => item.href === "/lead"));
});

test("kill switch and tenant override off hide both domains and domain email", () => {
  for (const allowed of [canUse(subject, { disabled: ["customDomain"] }), canUse({ ...subject, featureOverrides: { customDomain: { on: false, reason: "Tạm tắt" } } })]) {
    const hrefs = links(adminNav({ permissions, can: allowed })).map(item => item.href);
    assert.ok(!hrefs.includes("/ten-mien"));
    assert.ok(!hrefs.includes("/email"));
  }
});

test("ghost has no account security group; empty navigation groups are removed", () => {
  const ghost = effectivePermissions({ role: "owner", kind: "ghost", audience: "admin" });
  const nav = adminNav({ permissions: ghost, can });
  assert.ok(!nav.some(group => group.label === "Tài khoản của tôi"));
  assert.ok(!links(nav).some(item => item.href === "/doi-mat-khau" || item.href === "/tai-khoan/bao-mat"));
  assert.deepEqual(adminNav({ permissions: new Set<Permission>(), can }), []);
  assert.equal(adminNav({ permissions: new Set<Permission>(["account.password"]), can }).length, 1);
});

test("current matches root exactly and nested routes only at a path boundary", () => {
  for (const [pathname, expected] of [["/", ["/"]], ["/nhan-vien/x", ["/nhan-vien"]], ["/cai-dat/kenh-nhan-lead", ["/cai-dat/kenh-nhan-lead"]], ["/nhan-vien-khac", []], [null, []], [undefined, []]] as const) {
    assert.deepEqual(links(adminNav({ permissions, can, pathname })).filter(item => item.current).map(item => item.href), expected);
  }
});
