import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import type { HostRecord } from "@solar/db";
import { createProxy } from "../proxy";
import { config } from "../../../proxy";

const records: HostRecord[] = ["a", "b", "c"].map((name) => ({
  hostname: `${name}.localhost`, tenantId: `tenant-${name}`, siteId: `site-${name}`,
  status: "active", isPrimary: true, tenantStatus: "active", primaryHost: `${name}.localhost`,
}));
const request = (host: string, path = "/", extra: Record<string, string> = {}) => new NextRequest(`http://untrusted.localhost${path}`, { headers: { host, ...extra } });
const resolver = { resolve: async (host: string) => records.find((value) => value.hostname === host) ?? null };
const proxy = createProxy(resolver, { enabled: true, production: false });

test("three hosts select three tenants and keep path and search in the rewrite", async () => {
  for (const record of records) {
    const response = await proxy(request(record.hostname, "/cong-trinh/demo?q=1"));
    assert.equal(new URL(response.headers.get("x-middleware-rewrite")!).origin, "http://untrusted.localhost", "keep Next's origin for an internal rewrite");
    assert.equal(new URL(response.headers.get("x-middleware-rewrite")!).pathname, `/sites/${record.siteId}/cong-trinh/demo`);
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
  assert.equal(new URL(response.headers.get("x-middleware-rewrite")!).pathname, "/sites/site-a/");
  assert.equal((await proxy(new NextRequest("http://a.localhost/"))).status, 404, "URL host is never a Host fallback");
});

test("unknown or invalid host and direct internal paths are blocked", async () => {
  for (const host of ["unknown.localhost", "a.localhost/evil", "user@a.localhost"]) assert.equal((await proxy(request(host))).status, 404);
  for (const path of ["/sites", "/sites/x", "/sites/site-a/", "/%73ites/x", "/sites%2Fx"]) {
    assert.equal((await proxy(request("a.localhost", path, { "x-site-id": "site-a" }))).status, 404, path);
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
    assert.equal(response.headers.get("location"), `${production ? "https" : "http"}://a.localhost/lien-he?x=1`);
  }
  const orphan = createProxy({ resolve: async () => ({ ...alias, primaryHost: null }) }, { enabled: true });
  assert.ok((await orphan(request(alias.hostname))).headers.has("x-middleware-rewrite"));
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
