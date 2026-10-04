const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
// Exercise the real TS modules with Node's test runner, without another test framework.
const cache = new Map();
function load(relative) {
  const file = path.resolve(__dirname, "..", relative);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} };
  cache.set(file, mod);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const localRequire = (name) =>
    name.startsWith("@/") ? load(`src/${name.slice(2)}.ts`) : require(name);
  new Function("require", "module", "exports", output)(
    localRequire,
    mod,
    mod.exports,
  );
  return mod.exports;
}
process.env.NEXT_PUBLIC_SITE_URL = "https://solar.example.com/";
const { SITE_CONFIG, NAVIGATION_ITEMS, SERVICES } = load(
  "src/utils/constants.ts",
);
const { allProductsData } = load("src/data/products.ts");
const { allNewsArticles } = load("src/data/news.ts");
const { pageMetadata, serializeJsonLd } = load("src/utils/seo.ts");
test("brand and contact config uses the requested values", () => {
  assert.equal(SITE_CONFIG.name, "Minwy Solar");
  assert.equal(SITE_CONFIG.phone, "0708699808");
  assert.equal(SITE_CONFIG.email, "divt.it97@gmail.com");
  assert.equal(SITE_CONFIG.url, "https://solar.example.com");
});
test("every navigation route exists", () => {
  for (const item of NAVIGATION_ITEMS)
    assert.ok(
      fs.existsSync(path.resolve("src/app", `.${item.href}`, "page.tsx")),
      item.href,
    );
});
test("catalogs have unique IDs and existing image assets", () => {
  for (const collection of [allProductsData, allNewsArticles, SERVICES]) {
    assert.ok(collection.length > 0);
    assert.equal(
      new Set(collection.map((item) => item.id)).size,
      collection.length,
    );
    for (const item of collection)
      assert.ok(
        fs.existsSync(path.resolve("public", `.${item.image}`)),
        item.image,
      );
  }
  assert.ok(allProductsData.find((item) => item.id === 2).technicalSpecs);
  assert.ok(allProductsData.find((item) => item.id === 30)?.description);
});
test("canonical and social metadata point to the specific route", () => {
  const metadata = pageMetadata("Tấm pin", "Thông tin sản phẩm", "/product/17");
  assert.equal(metadata.alternates.canonical, "/product/17");
  assert.equal(metadata.openGraph.url, "/product/17");
  assert.equal(metadata.title.absolute, "Tấm pin | Minwy Solar");
  assert.deepEqual(metadata.twitter.images, [SITE_CONFIG.ogImage]);
});
test("sitemap contains exactly the static and supported detail routes", () => {
  const entries = load("src/app/sitemap.ts").default();
  assert.equal(
    entries.length,
    6 + allProductsData.length + SERVICES.length + allNewsArticles.length,
  );
  assert.equal(new Set(entries.map((entry) => entry.url)).size, entries.length);
  assert.ok(
    entries.some((entry) => entry.url === `${SITE_CONFIG.url}/contact-us`),
  );
  assert.ok(entries.every((entry) => !entry.url.includes("//product")));
});
test("robots uses the configured deployment origin", () => {
  assert.equal(
    load("src/app/robots.ts").default().sitemap,
    "https://solar.example.com/sitemap.xml",
  );
});
test("structured data cannot close its script element", () => {
  const json = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
  assert.ok(!json.includes("<"));
  assert.equal(JSON.parse(json).name, "</script><script>alert(1)</script>");
});
