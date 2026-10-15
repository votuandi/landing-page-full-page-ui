import assert from "node:assert/strict";
import test from "node:test";
import { breadcrumbJsonLd, faqJsonLd, isNoindexHost, matchRedirect, organizationJsonLd, productJsonLd, redirectRule, robotsTxt, siteOrigin, sitemapPaths, sitemapXml } from "../seo";
import { seoSchema } from "../contentSchemas";
import { tenantMetadata } from "../metadata";
import { collectSitemapPaths } from "../seoData";
import type { TenantCollections } from "../collections";

test("only preview subdomains (NOINDEX_DOMAINS) are noindex", () => {
  const suffixes = ["preview.solarweb.vn", " .preview.example "];
  for (const host of ["preview.solarweb.vn", "a.preview.solarweb.vn", "x.preview.example"]) assert.equal(isNoindexHost(host, suffixes), true);
  for (const host of ["a.solarweb.vn", "preview.solarweb.vn.evil.com", "congty.vn"]) assert.equal(isNoindexHost(host, suffixes), false);
  assert.equal(isNoindexHost("a.preview.solarweb.vn", [""]), false);
});

test("a platform subdomain that is the primary host is indexed; preview hosts are not (D21)", () => {
  const site = { primaryHost: "nang-luong-solar.solarweb.vn", name: "A", profile: {}, seo: {} };
  const previous = process.env.NOINDEX_DOMAINS;
  process.env.NOINDEX_DOMAINS = "preview.solarweb.vn";
  try {
    assert.equal(tenantMetadata(site, "/").robots, undefined);
    assert.deepEqual(tenantMetadata({ ...site, primaryHost: "a.preview.solarweb.vn" }, "/").robots, { index: false, follow: false });
  } finally {
    if (previous === undefined) delete process.env.NOINDEX_DOMAINS;
    else process.env.NOINDEX_DOMAINS = previous;
  }
});

test("sitemap leaves out pages missing from the site structure or plan (E5-S11)", async () => {
  const loaded: string[] = [];
  const items = (name: string) => async () => { loaded.push(name); return [{ slug: `${name}-1` }]; };
  const collections = { products: items("products"), services: items("services"), projects: items("projects"), posts: items("posts") } as unknown as TenantCollections;
  const site = { tenantId: "t", siteId: "s", profile: { legal: { policies: [{ slug: "bao-hanh" }] } }, planId: "basic", addons: [],
    pageTypes: ["home", "services", "news", "contact", "policy", "products"] } as unknown as Parameters<typeof collectSitemapPaths>[0];
  const pages = [{ slug: "", kind: "home" }, { slug: "lien-he", kind: "system" }, { slug: "ve-chung-toi", kind: "system" }, { slug: "uu-dai/nang-luong", kind: "landing" }];
  const paths = await collectSitemapPaths(site, collections, pages);
  assert.deepEqual(loaded.sort(), ["posts", "services"], "products need catalog; projects are not in the structure");
  // Basic has no landingPages: a published landing page stays out of the sitemap (D21).
  assert.deepEqual(paths, ["/", "/lien-he", "/giai-phap", "/giai-phap/services-1", "/tin-tuc", "/tin-tuc/posts-1", "/chinh-sach/bao-hanh"]);
  const pro = await collectSitemapPaths({ ...site, planId: "pro" }, collections, pages);
  assert.ok(pro.includes("/uu-dai/nang-luong"));
});

test("redirect rules match exact paths and one-segment params; reject off-site targets", () => {
  const rules = seoSchema.parse({ redirects: [{ from: "/about-us", to: "/ve-chung-toi" }, { from: "/product/:slug", to: "/san-pham/:slug" }] }).redirects;
  assert.equal(matchRedirect(rules, "/about-us"), "/ve-chung-toi");
  assert.equal(matchRedirect(rules, "/product/inverter-5kw"), "/san-pham/inverter-5kw");
  assert.equal(matchRedirect(rules, "/product/a/b"), null);
  assert.equal(matchRedirect(rules, "/missing"), null);
  assert.equal(matchRedirect([{ from: "/x", to: "/x" }], "/x"), null);
  for (const to of ["https://evil.com", "//evil.com", "/\\evil.com", "evil", "/a?b"]) assert.equal(redirectRule.safeParse({ from: "/a", to }).success, false);
  assert.deepEqual(seoSchema.parse({}).redirects, []);
});

test("robots points to the site's own sitemap unless noindex", () => {
  const origin = siteOrigin({ primaryHost: "a.vn" }, { production: true });
  assert.equal(origin, "https://a.vn");
  assert.match(robotsTxt(origin, false), /Sitemap: https:\/\/a\.vn\/sitemap\.xml/);
  assert.match(robotsTxt(origin, false), /Disallow: \/api\//);
  assert.doesNotMatch(robotsTxt(origin, true), /Sitemap/);
  assert.doesNotMatch(robotsTxt(origin, true), /Disallow: \/\n/);
});

test("sitemap lists only given site paths at its origin, escaped and deduplicated", () => {
  const paths = sitemapPaths({ pages: ["", "lien-he"], products: ["p1"], services: [], projects: ["c1"], posts: ["b1"], policies: ["bao-hanh"] });
  assert.deepEqual(paths, ["/", "/lien-he", "/san-pham", "/san-pham/p1", "/cong-trinh/c1", "/tin-tuc", "/tin-tuc/b1", "/chinh-sach/bao-hanh"]);
  const xml = sitemapXml("http://a.localhost:3211", [...paths, "/", "/a&b"]);
  assert.equal(xml.match(/<loc>http:\/\/a\.localhost:3211\/<\/loc>/g)?.length, 1);
  assert.match(xml, /a&#38;b/);
  assert.doesNotMatch(xml, /<loc>(?!http:\/\/a\.localhost:3211\/)/);
});

test("JSON-LD carries Google's required fields with absolute URLs", () => {
  const origin = "https://a.vn";
  const product = productJsonLd(origin, "/san-pham/p1", { name: "P1", brand: "B", images: ["/images/p1.webp", "00000000-0000-4000-8000-000000000001"], specs: { "Công suất": "5 kW" }, price: 100, salePrice: 90 });
  assert.equal(product["@type"], "Product");
  assert.deepEqual(product.image, ["https://a.vn/images/p1.webp"]);
  assert.deepEqual(product.offers && { price: product.offers.price, currency: product.offers.priceCurrency }, { price: 90, currency: "VND" });
  assert.equal("offers" in productJsonLd(origin, "/san-pham/p2", { name: "P2", brand: "B", images: [], specs: {} }), false);
  const crumbs = breadcrumbJsonLd(origin, [["Trang chủ", "/"], ["Sản phẩm", "/san-pham"]]);
  assert.deepEqual(crumbs.itemListElement.map((item) => [item.position, item.item]), [[1, "https://a.vn/"], [2, "https://a.vn/san-pham"]]);
  const org = organizationJsonLd(origin, { name: "A", hotline: "0901 234 567" }, [{ id: "hn", name: "Hà Nội", hotline: "0912345678", office: { address: "1 Phố A", lat: 21, lng: 105.8 } }]);
  const [organization, branch] = org["@graph"] as Record<string, unknown>[];
  assert.equal(organization.url, "https://a.vn/");
  assert.equal(organization.logo, "https://a.vn/favicon.svg");
  assert.equal(organization.telephone, "+84901234567");
  assert.equal(branch["@type"], "LocalBusiness");
  assert.equal(JSON.stringify(org).includes("http://"), false);
  assert.equal(faqJsonLd([{ question: "Q", answer: "A" }]).mainEntity[0].acceptedAnswer.text, "A");
});
