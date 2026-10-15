import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../../../app/api/lead/route";
import { leadFeatures, leadSourceFeature } from "../entitlements";
import { createTenantLeadHandler, LEAD_LIMITS, MIN_FILL_MS } from "../leadIntake";
import { createRateLimiter, memoryCounter } from "../rateLimit";
import type { SiteEntitlements } from "../siteData";
import type { LeadInput } from "@solar/db";

const tenantId = "00000000-0000-4000-8000-000000000001", siteId = "00000000-0000-4000-8000-000000000002";
const entitlements = (patch: Partial<SiteEntitlements> = {}): SiteEntitlements =>
  ({ planId: "pro", addons: [], status: "active", createdAt: new Date("2026-01-01T00:00:00Z"), disabled: [], ...patch });
const post = (body: string, ip = "203.0.113.1", headers: Record<string, string> = { "x-tenant-id": tenantId, "x-site-id": siteId }) =>
  new Request("http://a.localhost/api/lead", { method: "POST", headers: { ...headers, "x-forwarded-for": `${ip}, 10.0.0.1` }, body });
const lead = (source: string, extra: object = {}) => JSON.stringify({ name: "A", phone: "0901234500", source, elapsedMs: MIN_FILL_MS, ...extra });

function setup(patch: Partial<SiteEntitlements> = {}, opts: { save?: () => Promise<{ id: string }>; turnstile?: boolean } = {}) {
  const saved: { tenantId: string; siteId: string; lead: LeadInput }[] = [];
  const handler = createTenantLeadHandler({
    loadSite: async (t, s) => (t === tenantId && s === siteId ? { entitlements: entitlements(patch) } : null),
    saveLead: opts.save ?? (async (t, s, input) => { saved.push({ tenantId: t, siteId: s, lead: input }); return { id: `lead-${saved.length}` }; }),
    limiter: createRateLimiter(),
    verifyTurnstile: async () => opts.turnstile ?? true,
  });
  return { handler, saved };
}

test("tenant without quoteCart: POST /api/lead with source quote-cart → 403 in Vietnamese (E6-S02)", async () => {
  const { handler, saved } = setup();
  const denied = await handler(post(lead("quote-cart")));
  assert.equal(denied.status, 403);
  assert.match((await denied.json()).message, /Giỏ báo giá/);
  for (const source of ["dealer", "story-cta-x"]) assert.equal((await handler(post(lead(source)))).status, source === "dealer" ? 403 : 200);
  // Kill switch on an allowed feature also closes the endpoint.
  assert.equal((await setup({ disabled: ["calculator"] }).handler(post(lead("calculator")))).status, 403);
  assert.equal(saved.length, 1);
});

test("payload cannot unlock features through an allowed source (E5-S04 contract)", async () => {
  const { handler } = setup({ planId: "basic" });
  const send = (extra: object, ip?: string) => handler(post(lead("contact", extra), ip));
  assert.equal((await send({})).status, 200);
  for (const [i, extra] of [{ items: [{ sku: "x", name: "X", qty: 1 }] }, { estimate: { kWp: 5 } }, { businessType: "Đại lý" }].entries()) {
    assert.equal((await send(extra, `198.51.100.${i}`)).status, 403, JSON.stringify(extra));
  }
  assert.equal((await send({ items: [], estimate: "", businessType: null }, "198.51.100.9")).status, 200, "empty fields carry no feature");
  assert.deepEqual(leadFeatures({ source: "quote-cart", items: [{}] }), ["quoteCart"]);
});

test("tenant lead is stored for the host's tenant, never one named in the payload (E11-S01)", async () => {
  const { handler, saved } = setup({ planId: "premium" });
  const response = await handler(post(lead("quote-cart", { tenantId: "00000000-0000-4000-8000-0000000000ff", siteId: "x",
    items: [{ sku: "p1", name: "Tấm pin", qty: 2 }], page: "/gio-hang" })));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, id: "lead-1" });
  assert.equal(saved[0].tenantId, tenantId);
  assert.equal(saved[0].siteId, siteId);
  assert.equal(saved[0].lead.source, "quote-cart");
  assert.deepEqual(saved[0].lead.data.items, [{ sku: "p1", name: "Tấm pin", qty: 2 }]);
  assert.equal("tenantId" in saved[0].lead.data, false);
  for (const body of ["invalid JSON", "null", "[]"]) assert.equal((await handler(post(body))).status, 400);
  assert.equal((await handler(post(lead("contact", { phone: "123" }), "192.0.2.50"))).status, 400);
  const missing = post(lead("contact"), "192.0.2.51", { "x-tenant-id": tenantId });
  assert.equal((await handler(missing)).status, 404);
});

test("anti-spam: honeypot and too-fast forms get a silent ok and are not stored; Turnstile failure → 400", async () => {
  const { handler, saved } = setup();
  for (const extra of [{ website: "bot" }, { elapsedMs: 500 }, { elapsedMs: undefined }, { elapsedMs: "abc" }]) {
    const response = await handler(post(lead("contact", extra)));
    assert.equal(response.status, 200, JSON.stringify(extra));
    assert.deepEqual(await response.json(), { ok: true });
  }
  assert.equal(saved.length, 0);
  assert.equal((await setup({}, { turnstile: false }).handler(post(lead("contact")))).status, 400);
});

test("20 requests/minute from one IP → 429 with Retry-After; other IPs unaffected", async () => {
  const { handler } = setup();
  const statuses = [];
  // Distinct phones isolate the IP limit from the phone limit.
  for (let i = 0; i < 20; i++) statuses.push((await handler(post(lead("contact", { phone: `09012345${String(i).padStart(2, "0")}` })))).status);
  assert.deepEqual(statuses, [...Array(LEAD_LIMITS.ip.limit).fill(200), ...Array(20 - LEAD_LIMITS.ip.limit).fill(429)]);
  const limited = await handler(post(lead("contact")));
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  assert.equal((await handler(post(lead("contact", { phone: "0909999999" }), "203.0.113.2"))).status, 200);
  // Same phone from many IPs is limited too.
  const phone = setup().handler;
  const byPhone = [];
  for (let i = 0; i < LEAD_LIMITS.phone.limit + 1; i++) byPhone.push((await phone(post(lead("contact"), `192.0.2.${i}`))).status);
  assert.equal(byPhone.at(-1), 429);
});

test("rate limiter falls back to memory when Redis is down; storage failure → 503", async () => {
  let calls = 0;
  const hit = createRateLimiter({ primary: async () => { calls++; throw new Error("ECONNREFUSED"); }, fallback: memoryCounter() });
  const original = console.error;
  console.error = () => undefined;
  try {
    assert.equal((await hit("k", 1, 60_000)).ok, true);
    assert.equal((await hit("k", 1, 60_000)).ok, false);
  } finally { console.error = original; }
  assert.equal(calls, 2);
  const failing = setup({}, { save: async () => { throw new Error("db down"); } }).handler;
  console.error = () => undefined;
  try { assert.equal((await failing(post(lead("contact")))).status, 503); } finally { console.error = original; }
});

test("route wiring: tenant headers go to the tenant handler; single-site keeps the env adapters", async () => {
  const result = await POST(new Request("http://a.localhost/api/lead", { method: "POST", headers: { "x-tenant-id": "a" }, body: lead("contact") }));
  assert.equal(result.status, 404);
  const legacy = await POST(new Request("http://localhost/api/lead", { method: "POST", body: JSON.stringify({ website: "bot" }) }));
  assert.equal(legacy.status, 200);
});

test("lead sources map to the features in the packages/plans README table", () => {
  assert.deepEqual(["contact", "popup", "home-bottom", "calculator", "story-cta", "hero-bill", "dealer", "quote-cart", "website"].map(leadSourceFeature),
    ["leadForm", "leadForm", "quoteForm", "calculator", "calculator", "calculator", "dealer", "quoteCart", "leadForm"]);
});
