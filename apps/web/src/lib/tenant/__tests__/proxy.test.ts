import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import type { HostRecord } from "@solar/db";
import { createProxy } from "../proxy";
import { config } from "../../../proxy";
import { signPreviewCookie } from "../preview";

const records: HostRecord[] = ["a", "b", "c"].map((name) => ({
  hostname: `${name}.localhost`, tenantId: `tenant-${name}`, siteId: `site-${name}`,
  status: "active", isPrimary: true, tenantStatus: "active", primaryHost: `${name}.localhost`,
}));
const request = (host: string, path = "/", extra: Record<string, string> = {}) => new NextRequest(`http://untrusted.localhost${path}`, { headers: { host, ...extra } });
const resolver = { resolve: async (host: string) => records.find((value) => value.hostname === host) ?? null };
const proxy = createProxy(resolver, { enabled: true, production: false });

test("preview requires a tenant/site MAC cookie; entry bypasses cookie and every response is private/noindex with admin CSP", async t => {
  const previous = { PLATFORM_DOMAIN: process.env.PLATFORM_DOMAIN, PREVIEW_SECRET: process.env.PREVIEW_SECRET };
  process.env.PLATFORM_DOMAIN = "localhost";
  process.env.PREVIEW_SECRET = "preview-test-secret-0123456789abcdef";
  t.after(() => { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  const record = { ...records[0], hostname: "a.preview.localhost", isPrimary: false, primaryHost: "a.localhost" };
  const preview = createProxy({ resolve: async () => record }, { enabled: true, production: false });
  for (const cookie of [undefined, "forged", await signPreviewCookie("tenant-b", "site-a"), await signPreviewCookie("tenant-a", "site-b"),
    await signPreviewCookie("tenant-a", "site-a", undefined, Date.now() - 3_600_001)]) {
    const response = await preview(request(record.hostname, "/", cookie ? { cookie: `preview=${cookie}` } : {}));
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(response.headers.get("x-robots-tag"), "noindex");
    assert.equal(response.headers.get("content-security-policy"), "frame-ancestors http://a.admin.localhost");
  }
  const entry = await preview(request(record.hostname, "/api/preview?token=x"));
  assert.equal(entry.headers.get("x-middleware-request-x-preview"), "1");
  assert.equal(entry.headers.has("x-middleware-rewrite"), false);
  const response = await preview(request(record.hostname, "/lien-he", { cookie: `preview=${await signPreviewCookie("tenant-a", "site-a")}` }));
  assert.equal(new URL(response.headers.get("x-middleware-rewrite")!).pathname, "/sites/tenant-a/site-a/draft.auto/lien-he");
  assert.equal(response.headers.get("x-middleware-request-x-preview"), "1");
  const publicResponse = await proxy(request("a.localhost", "/", { "x-preview": "1" }));
  assert.equal(publicResponse.headers.get("x-middleware-request-x-preview"), null);
});

test("three hosts select three tenants and keep path and search in the rewrite", async () => {
  for (const record of records) {
    const response = await proxy(request(record.hostname, "/cong-trinh/demo?q=1"));
    assert.equal(new URL(response.headers.get("x-middleware-rewrite")!).origin, "http://untrusted.localhost", "keep Next's origin for an internal rewrite");
    assert.equal(new URL(response.headers.get("x-middleware-rewrite")!).pathname, `/sites/${record.tenantId}/${record.siteId}/auto/cong-trinh/demo`);
    assert.equal(new URL(response.headers.get("x-middleware-rewrite")!).search, "?q=1");
    assert.equal(response.headers.get("x-middleware-request-x-tenant-id"), record.tenantId);
    assert.equal(response.headers.get("x-middleware-request-x-site-id"), record.siteId);
    assert.equal(response.headers.get("x-tenant-id"), null);
  }
});

test("spoofed tenant and forwarded host headers cannot select another site", async () => {
  const response = await proxy(request("a.localhost", "/", {
    "x-tenant-id": "tenant-b", "x-site-id": "site-b", "x-forwarded-host": "b.localhost", forwarded: "host=b.localhost",
  }));
  assert.equal(response.headers.get("x-middleware-request-x-tenant-id"), "tenant-a");
  assert.equal(response.headers.get("x-middleware-request-x-site-id"), "site-a");
  assert.equal(new URL(response.headers.get("x-middleware-rewrite")!).pathname, "/sites/tenant-a/site-a/auto/");
  assert.equal((await proxy(new NextRequest("http://a.localhost/"))).status, 404, "URL host is never a Host fallback");
});

test("unknown or invalid host and direct internal paths are blocked", async () => {
  for (const host of ["unknown.localhost", "a.localhost/evil", "user@a.localhost"]) assert.equal((await proxy(request(host))).status, 404);
  for (const path of ["/sites", "/sites/x", "/SITES/x", "/sites/site-a/", "/%73ites/x", "/sites%2Fx"]) {
    assert.equal((await proxy(request("a.localhost", path, { "x-site-id": "site-a" }))).status, 404, path);
  }
});

test("resolver failures return an uncached 503 and log details only on the server", async (t) => {
  const error = new Error("DATABASE_URL missing or database unavailable: private details");
  const log = t.mock.method(console, "error", () => {});
  const unavailable = createProxy({ resolve: async () => { throw error; } }, { enabled: true });
  for (const path of ["/", "/api/lead"]) {
    const response = await unavailable(request("a.localhost", path));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(await response.text(), "Website tạm thời không khả dụng.");
    assert.equal(response.headers.has("x-middleware-rewrite"), false);
  }
  assert.equal(log.mock.callCount(), 2);
  for (const call of log.mock.calls) {
    assert.deepEqual(call.arguments, ["Tenant resolution failed", { host: "a.localhost" }, error]);
  }
});

test("invalid or noncanonical primary hosts are blocked instead of redirected", async () => {
  for (const primaryHost of ["bad/host", "A.localhost", "a.localhost:3210"]) {
    const invalid = createProxy({ resolve: async () => ({ ...records[0], isPrimary: false, primaryHost }) }, { enabled: true });
    const response = await invalid(request("www.a.localhost"));
    assert.equal(response.status, 404, primaryHost);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("location"), null);
  }
});

test("only active or verified domains serve; suspended tenant returns an uncached 403", async () => {
  for (const status of ["pending", "error", "removed"] as const) {
    const guarded = createProxy({ resolve: async () => ({ ...records[0], status }) }, { enabled: true });
    assert.equal((await guarded(request("a.localhost"))).status, 404);
  }
  const verified = createProxy({ resolve: async () => ({ ...records[0], status: "verified" }) }, { enabled: true });
  assert.ok((await verified(request("a.localhost"))).headers.has("x-middleware-rewrite"));
  const suspended = createProxy({ resolve: async () => ({ ...records[0], tenantStatus: "suspended" }) }, { enabled: true });
  const response = await suspended(request("a.localhost"));
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("www alias redirects 308 to canonical host with path/query and production HTTPS", async () => {
  const alias = { ...records[0], hostname: "www.a.localhost", isPrimary: false };
  for (const production of [false, true]) {
    const redirect = createProxy({ resolve: async () => alias }, { enabled: true, production });
    const response = await redirect(request(alias.hostname, "/lien-he?x=1"));
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("cache-control"), "public, max-age=300");
    assert.equal(response.headers.get("location"), `${production ? "https" : "http"}://a.localhost/lien-he?x=1`);
  }
  const orphan = createProxy({ resolve: async () => ({ ...alias, primaryHost: null }) }, { enabled: true });
  assert.ok((await orphan(request(alias.hostname))).headers.has("x-middleware-rewrite"));
});

test("canonical redirects keep the request port in development and omit it in production", async () => {
  for (const production of [false, true]) {
    const redirect = createProxy({ resolve: async () => ({ ...records[0], isPrimary: false }) }, { enabled: true, production });
    const response = await redirect(new NextRequest("http://untrusted.localhost:3210/lien-he?x=1", {
      headers: { host: "www.a.localhost:3210", "x-forwarded-host": "evil.localhost:9999" },
    }));
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("cache-control"), "public, max-age=300");
    assert.equal(response.headers.get("location"), production ? "https://a.localhost/lien-he?x=1" : "http://a.localhost:3210/lien-he?x=1");
  }
});

test("locale cookie and robots/sitemap select the internal tenant path", async () => {
  const path = async (url: string, cookie?: string) => new URL((await proxy(request("a.localhost", url, cookie ? { cookie } : {}))).headers.get("x-middleware-rewrite")!).pathname;
  assert.equal(await path("/lien-he", "solar-locale=en"), "/sites/tenant-a/site-a/en/lien-he");
  assert.equal(await path("/lien-he", "solar-locale=vi"), "/sites/tenant-a/site-a/vi/lien-he");
  assert.equal(await path("/lien-he", "solar-locale=../x"), "/sites/tenant-a/site-a/auto/lien-he");
  assert.equal(await path("/robots.txt", "solar-locale=en"), "/sites/tenant-a/site-a/robots.txt");
  assert.equal(await path("/sitemap.xml"), "/sites/tenant-a/site-a/sitemap.xml");
});

test("API keeps its route and receives only the resolved tenant headers", async () => {
  const response = await proxy(request("a.localhost", "/api/lead", { "x-tenant-id": "tenant-b" }));
  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.equal(response.headers.get("x-middleware-rewrite"), null);
  assert.equal(response.headers.get("x-middleware-request-x-tenant-id"), "tenant-a");
});

test("disabled mode strips tenant headers without invoking the resolver; internal route stays blocked", async () => {
  const disabled = createProxy({ resolve: async () => { throw Error("must not lookup"); } }, { enabled: false });
  const response = await disabled(request("a.localhost", "/lab", { "x-tenant-id": "tenant-b", "x-site-id": "site-b" }));
  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.equal(response.headers.get("x-middleware-request-x-tenant-id"), null);
  assert.equal(response.headers.get("x-middleware-request-x-site-id"), null);
  assert.equal(response.headers.get("x-middleware-override-headers")?.includes("x-site-id"), false);
  assert.equal((await disabled(request("a.localhost", "/sites/site-b"))).status, 404);
});

test("matcher excludes shared assets while protecting APIs, robots and internal paths", () => {
  for (const url of ["/", "/robots.txt", "/api/lead", "/sites/x", "/images-private", "/logo.svg/route", "/favicon.ico/route"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, url }), true, url);
  }
  for (const url of ["/_next/static/a.js", "/_next/image?url=x", "/fonts/a.woff2", "/images/a.jpg", "/videos/a.mp4", "/preset-media/a.jpg", "/backup/a.jpg", "/favicon.ico", "/favicon.png", "/logo.svg", "/site.webmanifest"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, url }), false, url);
  }
});

test("internal revalidation bypasses host lookup and strips spoofed tenant headers", async () => {
  const bypass = createProxy({ resolve: async () => { throw Error("must not resolve"); } }, { enabled: true });
  const response = await bypass(request("internal-web", "/api/revalidate", { "x-tenant-id": "spoof", "x-site-id": "spoof" }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.equal(response.headers.get("x-middleware-request-x-tenant-id"), null);
  assert.equal(response.headers.get("x-middleware-request-x-site-id"), null);
});
