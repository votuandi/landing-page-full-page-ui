import assert from "node:assert/strict";
import { test } from "node:test";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { config, proxy } from "../proxy.ts";
import type { getRuntime } from "../lib/runtime.ts";
import { previewUrl } from "../lib/previewUrl.ts";

function runtime(t: { after(fn: () => void): void }, status: string | null = "active") {
  const state = globalThis as typeof globalThis & { solarAdminRuntime?: ReturnType<typeof getRuntime> };
  const previous = state.solarAdminRuntime;
  state.solarAdminRuntime = {
    platform: "solar.localhost", secret: "s".repeat(32),
    resolveHost: async () => status ? { tenantId: "a", siteId: "site-a", slug: "a", tenantStatus: status } : null,
  } as unknown as ReturnType<typeof getRuntime>;
  t.after(() => { state.solarAdminRuntime = previous; });
}

const request = () => new NextRequest("http://a.admin.solar.localhost:3300/dang-nhap", { headers: {
  host: "a.admin.solar.localhost:3300", "content-security-policy": "script-src 'nonce-forged'", "x-nonce": "forged",
} });

test("nonce per request", async t => {
  runtime(t);
  const policies: string[] = [];
  for (let i = 0; i < 2; i++) {
    const response = await proxy(request());
    const csp = response.headers.get("content-security-policy")!;
    assert.ok(csp);
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
    assert.ok(nonce); assert.equal(Buffer.from(nonce, "base64").toString("base64"), nonce);
    assert.ok(Buffer.from(nonce, "base64").length >= 16);
    assert.match(csp, /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    assert.doesNotMatch(csp, /forged|'unsafe-inline'.*script-src/);
    assert.equal(response.headers.get("x-middleware-request-content-security-policy"), csp);
    assert.notEqual(response.headers.get("x-middleware-request-x-nonce"), "forged");
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    policies.push(csp);
  }
  assert.notEqual(policies[0], policies[1]);
});

test("frame-src allows own preview only", async t => {
  runtime(t);
  const port = process.env.TENANT_PUBLIC_PORT;
  process.env.TENANT_PUBLIC_PORT = "3212";
  t.after(() => { if (port === undefined) delete process.env.TENANT_PUBLIC_PORT; else process.env.TENANT_PUBLIC_PORT = port; });
  const response = await proxy(request());
  const directive = response.headers.get("content-security-policy")?.split(";").find(value => value.trim().startsWith("frame-src"));
  const origin = new URL(previewUrl({ slug: "a", platform: "solar.localhost", production: process.env.NODE_ENV === "production", port: "3212", path: "/", token: "t" })).origin;
  assert.ok(directive?.split(/\s+/).includes(origin));
  assert.doesNotMatch(directive!, /\*|b\.preview/);
});

test("error rewrites carry nonce CSP on request and response", async t => {
  for (const status of [null, "suspended"]) {
    await t.test(status ?? "missing", async sub => {
      runtime(sub, status);
      const response = await proxy(request());
      assert.equal(response.status, status ? 403 : 404);
      const csp = response.headers.get("content-security-policy");
      assert.match(csp!, /'nonce-[^']+'/);
      assert.equal(response.headers.get("x-middleware-request-content-security-policy"), csp);
    });
  }
});

test("health bypasses host proxy", () => {
  for (const url of ["/api/health", "/api/health/", "/api/health?probe=1"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, url }), false, url);
  }
  for (const url of ["/api/lead", "/api/health-private", "/api/health/other"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, url }), true, url);
  }
});
