import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { previewSlug, signPreviewCookie, verifyPreviewCookie, safePreviewPath } from "../preview";
import { createPreviewHandler } from "../previewRoute";

const secret = "preview-test-secret-0123456789abcdef";
test("preview cookie MAC binds tenant/site, expires and rejects tampering or weak config", async () => {
  const cookie = await signPreviewCookie("tenant-a", "site-a", secret, 1000);
  assert.equal(await verifyPreviewCookie(cookie, "tenant-a", "site-a", secret, 1001), true);
  for (const [token, tenant, site, key, now] of [
    [cookie, "tenant-b", "site-a", secret, 1001], [cookie, "tenant-a", "site-b", secret, 1001],
    [cookie, "tenant-a", "site-a", secret, 3_601_000], [cookie + "x", "tenant-a", "site-a", secret, 1001],
    [cookie, "tenant-a", "site-a", "another-secret-0123456789abcdef012345", 1001],
    ["broken", "tenant-a", "site-a", secret, 1001],
  ] as const) assert.equal(await verifyPreviewCookie(token, tenant, site, key, now), false);
  await assert.rejects(signPreviewCookie("a", "s", "short"), /32/);
});
test("preview host is exact and redirect accepts only local paths", () => {
  assert.equal(previewSlug("demo-t15.preview.localhost", "localhost"), "demo-t15");
  for (const host of ["preview.localhost", "x.y.preview.localhost", "x.preview.localhost.evil", "-x.preview.localhost"])
    assert.equal(previewSlug(host, "localhost"), null);
  for (const path of ["//evil.vn", "/\\evil.vn", "https://evil.vn", "/%2f%2fevil.vn", "/%5cevil.vn", "/\r\nLocation: evil", "/%00evil", "/%zz"])
    assert.equal(safePreviewPath(path), null);
  assert.equal(safePreviewPath("/lien-he?q=1"), "/lien-he?q=1");
});
test("preview entry rejects missing/used/expired/wrong-host tokens and enables host-only session on success", async () => {
  let enabled = 0;
  const handle = createPreviewHandler({ secret: () => secret, production: true, enableDraft: async () => { enabled++; },
    consume: async (tenant, token) => tenant === "a" && token === "valid" ? { siteId: "s" } : null });
  const request = (query: string, headers: Record<string, string> = { "x-preview": "1", "x-tenant-id": "a", "x-site-id": "s" }) =>
    new NextRequest(`https://a.preview.example.vn/api/preview${query}`, { headers });
  for (const token of ["", "expired", "used", "wrong"]) assert.equal((await handle(request(`?token=${token}`))).status, 401);
  assert.equal((await handle(request("?token=valid", {}))).status, 401);
  assert.equal((await handle(request("?token=valid", { "x-preview": "1", "x-tenant-id": "b", "x-site-id": "s" }))).status, 401);
  assert.equal((await handle(request("?token=valid", { "x-preview": "1", "x-tenant-id": "a", "x-site-id": "other" }))).status, 401);
  assert.equal(enabled, 0);
  const response = await handle(request("?token=valid&path=%2Flien-he"));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "/lien-he");
  for (const expected of [/^__Host-preview=/, /; HttpOnly/i, /; Secure/i, /; SameSite=lax/i, /; Path=\//i]) assert.match(response.headers.get("set-cookie")!, expected);
  assert.doesNotMatch(response.headers.get("set-cookie")!, /Domain=/i);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(enabled, 1);
});

test("preview validates and encodes Location before spending a one-use token", async () => {
  let consumed = 0, enabled = 0;
  const handle = createPreviewHandler({ secret: () => secret, production: true,
    consume: async () => { consumed++; return { siteId: "s" }; }, enableDraft: async () => { enabled++; } });
  const request = (path: string) => new NextRequest(`https://a.preview.example.vn/api/preview?token=valid&${new URLSearchParams({ path })}`, {
    headers: { "x-preview": "1", "x-tenant-id": "a", "x-site-id": "s" },
  });
  for (const path of ["//evil.vn", "/\\evil.vn", "/%zz", "/%00bad", "/\r\nLocation: bad", "/%ED%A0%80"]) {
    assert.equal((await handle(request(path))).status, 400, path);
    assert.equal(consumed, 0);
    assert.equal(enabled, 0);
  }
  const path = "/điện-mặt-trời?q=Việt%2BNam";
  const response = await handle(request(path));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), encodeURI(path).replaceAll("%25", "%"));
  assert.equal(consumed, 1);
  assert.equal(enabled, 1);
});
test("theme param validates before consume, sets or clears httpOnly preview cookie", async () => {
  const { createPreviewHandler } = await import("../previewRoute");
  const { NextRequest } = await import("next/server");
  let consumed = 0;
  const handler = createPreviewHandler({ consume: async () => { consumed++; return { siteId: "site" }; }, enableDraft: async () => {}, secret: () => "preview-secret-long-enough-0123456789", production: false });
  const request = (query: string) => new NextRequest(`http://a.preview.localhost/api/preview?token=token${query}`, { headers: { "x-tenant-id": "tenant", "x-site-id": "site", "x-preview": "1" } });
  assert.equal((await handler(request("&theme=bad%3Bvalue"))).status, 400); assert.equal(consumed, 0);
  const preview = await handler(request("&theme=t15"));
  assert.equal(preview.cookies.get("solar-preview-theme")?.value, "t15");
  assert.match(preview.headers.get("set-cookie")!, /HttpOnly/);
  const reset = await handler(request(""));
  assert.equal(reset.cookies.get("solar-preview-theme")?.value, "");
  assert.match(reset.headers.get("set-cookie")!, /Max-Age=0/);
});
