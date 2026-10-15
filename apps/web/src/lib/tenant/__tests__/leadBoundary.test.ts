import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../../../app/api/lead/route";
import { createTenantLeadGate, leadSourceFeature } from "../entitlements";
import type { SiteEntitlements } from "../siteData";

const tenantId = "00000000-0000-4000-8000-000000000001", siteId = "00000000-0000-4000-8000-000000000002";
const entitlements = (patch: Partial<SiteEntitlements> = {}): SiteEntitlements =>
  ({ planId: "pro", addons: [], status: "active", createdAt: new Date("2026-01-01T00:00:00Z"), disabled: [], ...patch });
const post = (body: string) => new Request("http://a.localhost/api/lead", { method: "POST", headers: { "x-tenant-id": tenantId, "x-site-id": siteId }, body });
const lead = (source: string) => JSON.stringify({ name: "A", phone: "0901234500", source });

test("tenant without quoteCart: POST /api/lead with source quote-cart → 403 in Vietnamese (E6-S02)", async () => {
  const gate = createTenantLeadGate(async () => ({ entitlements: entitlements() }));
  const denied = await gate(post(lead("quote-cart")));
  assert.equal(denied.status, 403);
  assert.match((await denied.json()).message, /Giỏ báo giá/);
  for (const source of ["dealer", "story-cta-x"]) assert.equal((await gate(post(lead(source)))).status, source === "dealer" ? 403 : 503);
  // Kill switch on an allowed feature also closes the endpoint.
  assert.equal((await createTenantLeadGate(async () => ({ entitlements: entitlements({ disabled: ["calculator"] }) }))(post(lead("calculator")))).status, 403);
});

test("allowed tenant leads still stop at 503 (E11 stores them); never reach the shared adapters", async () => {
  const gate = createTenantLeadGate(async (t, s) => (t === tenantId && s === siteId ? { entitlements: entitlements({ planId: "premium" }) } : null));
  for (const source of ["quote-cart", "home-bottom", "calculator", ""]) assert.equal((await gate(post(lead(source)))).status, 503);
  for (const body of ["invalid JSON", "null", "[]"]) assert.equal((await gate(post(body))).status, 400);
  const missing = new Request("http://a.localhost/api/lead", { method: "POST", headers: { "x-tenant-id": tenantId }, body: lead("contact") });
  assert.equal((await gate(missing)).status, 404);
  // Route wiring: unknown tenant IDs never load a site or dispatch.
  const result = await POST(new Request("http://a.localhost/api/lead", { method: "POST", headers: { "x-tenant-id": "a" }, body: JSON.stringify({ website: "bot" }) }));
  assert.equal(result.status, 404);
  const legacy = await POST(new Request("http://localhost/api/lead", { method: "POST", body: JSON.stringify({ website: "bot" }) }));
  assert.equal(legacy.status, 200);
});

test("lead sources map to the features documented in packages/plans README", () => {
  assert.deepEqual(["contact", "popup", "home-bottom", "calculator", "story-cta", "hero-bill", "dealer", "quote-cart", "website"].map(leadSourceFeature),
    ["leadForm", "leadForm", "quoteForm", "calculator", "calculator", "calculator", "dealer", "quoteCart", "leadForm"]);
});
