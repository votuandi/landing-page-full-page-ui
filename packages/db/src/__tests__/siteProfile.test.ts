import assert from "node:assert/strict";
import { test } from "node:test";
import { companyProfileSchema, siteProfileSchema } from "../siteProfile.ts";

test("company form accepts raw existing profiles without a legal object", () => {
  for (const raw of [{}, { name: "[DỮ LIỆU MẪU]", brand: { legalName: "[DỮ LIỆU MẪU] Pháp lý" } }]) {
    assert.deepEqual(companyProfileSchema.parse(raw), companyProfileSchema.parse(siteProfileSchema.parse(raw)));
  }
});

test("existing profiles still parse", () => {
  for (const input of [{}, { name: "[DỮ LIỆU MẪU] Công ty", legal: { policies: [] }, guide: { items: [] }, team: [], timeline: [] }]) {
    const value = siteProfileSchema.parse(input);
    assert.deepEqual(siteProfileSchema.parse(JSON.parse(JSON.stringify(value))), value);
  }
});
test("rejects invalid fields", () => {
  for (const value of [{ email: "x" }, { brand: { url: "http://example.com" } }, { reviews: { google: { url: "https://example.com", rating: 6, count: 1 } } }, { brand: { foundedYear: 1800 } }, { name: "x".repeat(5001) }]) assert.equal(siteProfileSchema.safeParse(value).success, false);
});
test("keeps special characters", () => {
  const name = '☀️ Công ty "Mẫu"\nDòng hai';
  assert.equal(siteProfileSchema.parse({ name }).name, name);
});
