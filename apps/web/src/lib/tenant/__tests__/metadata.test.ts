import assert from "node:assert/strict";
import test from "node:test";
import { tenantMetadata } from "../metadata";
import { asset, contentImage } from "../contentSchemas";

test("favicon icons include versioned PNG and apple or default SVG", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const site = { primaryHost: "a.localhost", name: "A", profile: { brand: { favicon: id } }, seo: {} };
  assert.deepEqual(tenantMetadata(site, "/").icons, {
    icon: [{ url: `/icon.png?v=${id}`, type: "image/png", sizes: "64x64" }],
    apple: [{ url: `/apple-icon.png?v=${id}`, sizes: "180x180" }],
  });
  assert.deepEqual(tenantMetadata({ ...site, profile: {} }, "/").icons, { icon: "/favicon.svg" });
});

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

test("EN and empty SEO fallbacks produce exact metadata at the primary host for every public route type", () => {
  const site = { primaryHost: "primary.localhost", name: "Site", locale: "en" as const, profile: { name: { vi: "VI brand", en: "EN brand" }, description: { vi: "VI description", en: "EN description" } }, seo: {} };
  for (const path of ["/", "/uu-dai/nang-luong", "/san-pham", "/giai-phap", "/tin-tuc", "/cam-nang", "/ve-chung-toi", "/lien-he", "/chinh-sach/bao-hanh", "/san-pham/shared", "/cong-trinh/shared", "/tin-tuc/shared", "/giai-phap/shared"]) {
    const result = tenantMetadata(site, path + "?host=foreign.localhost", "English title", undefined, { production: true, image: "/images/detail.webp" });
    assert.equal(result.title, "English title | EN brand");
    assert.equal(result.description, "EN description");
    assert.equal(result.alternates?.canonical, `https://primary.localhost${path}`);
    assert.match(JSON.stringify(result.openGraph), /https:\/\/primary.localhost\/images\/detail.webp/);
    assert.match(JSON.stringify(result.openGraph), /en_US/);
    assert.doesNotMatch(JSON.stringify(result), /foreign|VI brand/);
  }
  assert.equal(tenantMetadata({ ...site, profile: {} }, "/").description, "Site");
  assert.deepEqual((tenantMetadata(site, "/", undefined, undefined, { image: "javascript:alert(1)" }).openGraph as { images: unknown }).images, []);
});
