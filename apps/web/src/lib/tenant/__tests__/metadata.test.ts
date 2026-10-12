import assert from "node:assert/strict";
import test from "node:test";
import { tenantMetadata } from "../metadata";
import { asset, contentImage } from "../contentSchemas";

test("canonical and OG use primary host and public path, no rewrite/query/foreign brand", () => {
  const site = { primaryHost: "a.localhost", name: "Site A", profile: { name: { vi: "Brand A" } }, seo: { description: { vi: "Description A" }, ogImage: "/images/a.webp" } };
  const result = tenantMetadata(site, "/tin-tuc/shared?brand=B", "Title A", "Body A", { production: false, port: "3211" });
  assert.equal(result.alternates?.canonical, "http://a.localhost:3211/tin-tuc/shared");
  assert.equal(result.title, "Title A | Brand A");
  assert.equal(result.description, "Body A");
  assert.doesNotMatch(JSON.stringify(result), /sites\//);
  assert.match(JSON.stringify(result.openGraph), /images\/a.webp/);
  assert.equal(tenantMetadata(site, "/", undefined, undefined, { production: true }).alternates?.canonical, "https://a.localhost/");
});

test("content image boundary permits UUID placeholders and safe paths/HTTPS; rejects traversal and script URLs", () => {
  for (const value of ["//foreign.test/image", "/images/%2e%2e/secret", "/images/a%5cb.png", "javascript:alert(1)", "http://foreign.test/image"]) assert.equal(asset.safeParse(value).success, false);
  assert.equal(contentImage.safeParse("00000000-0000-4000-8000-000000000001").success, true);
  assert.equal(asset.safeParse("https://example.com/image.webp").success, true);
});
