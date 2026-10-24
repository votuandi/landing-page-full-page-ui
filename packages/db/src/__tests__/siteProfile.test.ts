import assert from "node:assert/strict";
import { test } from "node:test";
import { companyProfileSchema, siteProfileSchema, siteProfileMediaIds, mergeCompanyProfile } from "../siteProfile.ts";

test("company form cannot overwrite or remove favicon managed by appearance", () => {
  const favicon = "00000000-0000-4000-8000-000000000001";
  const current = { brand: { logo: "/logo.svg", favicon } };
  const input = companyProfileSchema.parse({ brand: { logo: "/new.svg", favicon: "00000000-0000-4000-8000-000000000002" } });
  const saved = mergeCompanyProfile(current, input);
  assert.deepEqual(saved.brand, { logo: "/new.svg", favicon });
  assert.equal("favicon" in input.brand, false);
});

test("siteProfileMediaIds includes favicon for publish and preserves team ids", () => {
  const favicon = "00000000-0000-4000-8000-000000000001", image = "00000000-0000-4000-8000-000000000002";
  const profile = { brand: { favicon }, team: [{ name: "Mẫu", role: "Mẫu", image }] };
  assert.equal(siteProfileSchema.parse(profile).brand.favicon, favicon);
  assert.deepEqual(new Set(siteProfileMediaIds(profile)), new Set([favicon, image]));
  assert.equal(siteProfileSchema.safeParse({ brand: { favicon: "bad" } }).success, false);
  assert.deepEqual(siteProfileMediaIds({}), []);
});

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
