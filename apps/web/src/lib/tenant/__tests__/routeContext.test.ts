import assert from "node:assert/strict";
import { test } from "node:test";
import { cookieLocale, formatTenantContext, parseTenantContext } from "../routeContext";

test("tenant context round-trips and rejects unknown segments", () => {
  for (const locale of ["vi", "en", "auto"] as const) for (const preview of [false, true]) {
    assert.deepEqual(parseTenantContext(formatTenantContext({ locale, preview })), { locale, preview });
  }
  for (const ctx of ["", "fr", "draft.", "draft.fr", "draft.draft.vi", "VI", "robots.txt"]) assert.equal(parseTenantContext(ctx), null);
  assert.equal(cookieLocale("en"), "en");
  assert.equal(cookieLocale(undefined), "auto");
  assert.equal(cookieLocale("draft.vi"), "auto");
});
