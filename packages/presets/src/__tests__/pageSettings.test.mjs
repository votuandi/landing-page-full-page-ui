import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
const require = createRequire(import.meta.url);

test("landingSlugIssue: rejects reserved, malformed and oversized slugs", () => {
  const { landingSlugIssue } = require("../index.ts");
  for (const slug of ["", "Trang-Trai", "a//b", "a/b/c/d", "a".repeat(121), "san-pham/x", "cong-trinh/x", "giai-phap/x", "tin-tuc/x", "chinh-sach", "chinh-sach/x", "sites/x", "api", "lab", "lien-he", "ve-chung-toi", "cam-nang", "🌞", "a\\b", "a|b"]) assert.equal(typeof landingSlugIssue(slug), "string", slug);
  for (const slug of ["trang-trai", "a/b/c", "a".repeat(120), "uu-dai/nang-luong", "builder-page", "dashboard-draft", "uu-dai/preview-only"]) assert.equal(landingSlugIssue(slug), null, slug);
});

test("page settings validate types, localized bounds and tolerate legacy/corrupt rows", t => {
  const { pageSettingsSchema, parsePageSettings } = require("../index.ts");
  const log = t.mock.method(console, "error", () => {});
  assert.deepEqual(parsePageSettings(null), {});
  assert.deepEqual(parsePageSettings(undefined), {});
  for (const raw of [[], "private", { hideHeader: "true" }, { secret: true }, { seo: { title: { vi: "a".repeat(71) } } }, { seo: { description: { vi: "ok", en: "a".repeat(161) } } }]) {
    assert.equal(pageSettingsSchema.safeParse(raw).success, false);
    assert.deepEqual(parsePageSettings(raw), {});
  }
  const settings = { seo: { title: { vi: "a".repeat(70), en: "EN" }, description: { vi: "a".repeat(160) }, noindex: true }, hideHeader: true, hideFooter: false };
  assert.deepEqual(parsePageSettings(settings), settings);
  assert.equal(log.mock.callCount(), 6);
  assert.doesNotMatch(JSON.stringify(log.mock.calls), /private/);
});
