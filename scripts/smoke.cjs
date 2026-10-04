const assert = require("node:assert/strict");
const base = process.env.SMOKE_URL || "http://localhost:3000";
(async () => {
  const sitemap = await fetch(`${base}/sitemap.xml`);
  assert.equal(sitemap.status, 200);
  const xml = await sitemap.text();
  const paths = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(
    (match) => new URL(match[1]).pathname,
  );
  for (const path of paths) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /Minwy Solar/);
    assert.ok(!/Trọng Tín|0909019234|phanphoisolar\.com/.test(html), path);
    assert.ok(html.includes("tel:0708699808"), path);
    assert.ok(html.includes("mailto:divt.it97@gmail.com"), path);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    assert.ok(canonical, path);
    assert.equal(
      new URL(canonical[1]).pathname.replace(/\/$/, "") || "/",
      path.replace(/\/$/, "") || "/",
      path,
    );
  }
  for (const path of [
    "/product/999999",
    "/service/no-such-item",
    "/news/no-such-item",
  ])
    assert.equal((await fetch(`${base}${path}`)).status, 404, path);
  for (const asset of [
    "/icon.svg",
    "/apple-icon.png",
    "/favicon.ico",
    "/robots.txt",
  ])
    assert.equal((await fetch(`${base}${asset}`)).status, 200, asset);
  console.log(
    `Passed: ${paths.length} sitemap routes, canonical URLs, contact links, invalid detail 404s, and SEO assets.`,
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
