import assert from "node:assert/strict";
import { test } from "node:test";
import { adminSlug, createHostResolver } from "../lib/host.ts";
import { requestHost, hostContext } from "../lib/hostContext.ts";

test("only an exact admin subdomain and valid slug are accepted", () => {
  assert.equal(adminSlug("demo-t15.admin.solar.localhost:3300", "solar.localhost"), "demo-t15");
  assert.equal(adminSlug("DEMO.admin.SOLAR.LOCALHOST", "solar.localhost"), "demo");
  for (const host of ["demo.solar.localhost", "demo.admin.solar.localhost.evil", "admin.solar.localhost", "a.b.admin.solar.localhost", "-bad.admin.solar.localhost", "a.admin.solar.localhost:bad", "a.admin.solar.localhost@evil", "a.admin.solar.localhost."]) {
    assert.equal(adminSlug(host, "solar.localhost"), null, host);
  }
});

test("internal redirect retains only a signed host context; raw host wins and forwarded spoofing fails", () => {
  const secret = "h".repeat(32), platform = "solar.localhost", a = "a.admin.solar.localhost:3300", b = "b.admin.solar.localhost:3300";
  const proof = hostContext(a, secret, 1000);
  assert.equal(requestHost(new Headers({ host: "localhost:3300", "x-admin-host-context": proof }), platform, secret, 1001), a);
  assert.equal(requestHost(new Headers({ host: b, "x-admin-host-context": proof }), platform, secret, 1001), b);
  assert.equal(requestHost(new Headers({ host: "localhost:3300", "x-forwarded-host": a }), platform, secret, 1001), "localhost:3300");
  assert.equal(requestHost(new Headers({ host: "localhost:3300", "x-admin-host-context": proof + "x" }), platform, secret, 1001), "localhost:3300");
  assert.equal(requestHost(new Headers({ host: "localhost:3300", "x-admin-host-context": proof }), platform, secret, 301001), "localhost:3300");
});

test("host resolution caches for 60 seconds, expires and rejects suspended/unknown", async () => {
  let time = 0, calls = 0;
  const resolve = createHostResolver(async slug => {
    calls++;
    return slug === "missing" ? null : { tenantId: "a", siteId: "s", tenantStatus: slug === "paused" ? "suspended" : "active" };
  }, "solar.localhost", () => time);
  assert.equal((await resolve("a.admin.solar.localhost"))?.tenantId, "a");
  await resolve("a.admin.solar.localhost");
  assert.equal(calls, 1);
  time = 60_001;
  await resolve("a.admin.solar.localhost");
  assert.equal(calls, 2);
  assert.equal(await resolve("missing.admin.solar.localhost"), null);
  assert.equal((await resolve("paused.admin.solar.localhost"))?.tenantStatus, "suspended");
  assert.equal(await resolve("evil.example"), null);
});
