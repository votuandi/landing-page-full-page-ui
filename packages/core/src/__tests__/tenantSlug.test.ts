import { test } from "node:test";
import assert from "node:assert/strict";
import { adminUsernameFor, assertTenantSlug, isTenantSlug, RESERVED_TENANT_SLUGS } from "../tenantSlug";

test("subdomain: nhận nhãn DNS hợp lệ, từ chối sai định dạng và slug dành riêng", () => {
  for (const slug of ["nang-luong-solar", "abc", "a1b", `a${"b".repeat(61)}c`]) assert.ok(isTenantSlug(slug), slug);
  for (const slug of ["-abc", "abc-", "a", "ab", "xn--abc", "a--b", "Nang_Luong", "nang luong", `a${"b".repeat(62)}c`, ...RESERVED_TENANT_SLUGS]) {
    assert.equal(isTenantSlug(slug), false, slug);
    assert.throws(() => assertTenantSlug(slug), /Subdomain/);
  }
});

test("tài khoản admin tự tạo bỏ dấu gạch của subdomain", () => {
  assert.equal(adminUsernameFor("nang-luong-solar"), "nangluongsolar_admin");
  assert.equal(adminUsernameFor("demo-t15"), "demot15_admin");
  assert.throws(() => adminUsernameFor("admin"));
});
