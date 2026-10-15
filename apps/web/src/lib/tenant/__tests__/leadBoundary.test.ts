import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../../../app/api/lead/route";
import { leadFeatures, leadSourceFeature } from "../entitlements";
import { createTenantLeadHandler, LEAD_LIMITS, MIN_FILL_MS, toLeadInput, verifyTurnstile } from "../leadIntake";
import { createRateLimiter, memoryCounter, redisCounter } from "../rateLimit";
import { parseLead } from "../../leads/parse";
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
  // No `elapsedMs`: the tenant handler answers before the rate limiter, so no Redis connection is opened here.
  const body = JSON.stringify({ name: "A", phone: "0901234500", source: "contact" });
  const tenant = await POST(new Request("http://a.localhost/api/lead", { method: "POST", headers: { "x-tenant-id": "a" }, body }));
  assert.deepEqual([tenant.status, await tenant.json()], [200, { ok: true }]);
  const legacy = await POST(new Request("http://localhost/api/lead", { method: "POST", body }));
  assert.deepEqual([legacy.status, await legacy.json()], [200, { ok: true, mode: "demo", delivered: [] }]);
});

test("lead sources map to the features in the packages/plans README table", () => {
  assert.deepEqual(["contact", "popup", "home-bottom", "calculator", "story-cta", "hero-bill", "dealer", "quote-cart", "website"].map(leadSourceFeature),
    ["leadForm", "leadForm", "quoteForm", "calculator", "calculator", "calculator", "dealer", "quoteCart", "leadForm"]);
});

test("parseLead keeps the t15 payload contract: trims, bounds and normalizes every field", () => {
  const parsed = parseLead({
    name: `  ${"N".repeat(200)} `, phone: "+84 901 234 567", zalo: "0901", address: " Q1 ", email: "a@b.vn", message: "m".repeat(3000),
    source: "quote cart!", segment: "Hộ gia đình", province: "TP. Hồ Chí Minh", businessType: "Đại lý", page: "/gio-hang",
    estimate: { kWp: 5, ok: true, note: "x".repeat(300), nested: { no: 1 } },
    items: [{ sku: "p1", name: "Tấm pin", qty: 2.7 }, { sku: "", name: "skip" }, { sku: "p2", name: "Inverter", qty: 5000 }, null],
  }, new Date("2026-10-15T00:00:00Z"));
  assert.ok("lead" in parsed);
  const { lead } = parsed;
  assert.equal(lead.name.length, 120);
  assert.equal(lead.phone, "0901234567");
  assert.equal(lead.message?.length, 2000);
  assert.equal(lead.source, "quotecart");
  assert.deepEqual([lead.province, lead.businessType, lead.page, lead.address], ["TP. Hồ Chí Minh", "Đại lý", "/gio-hang", "Q1"]);
  assert.deepEqual(lead.estimate, { kWp: 5, ok: true, note: "x".repeat(200) });
  assert.deepEqual(lead.items, [{ sku: "p1", name: "Tấm pin", qty: 2 }, { sku: "p2", name: "Inverter", qty: 999 }]);
  assert.equal(lead.submittedAt, "2026-10-15T00:00:00.000Z");
  assert.deepEqual(toLeadInput(lead).data, { zalo: "0901", address: "Q1", province: "TP. Hồ Chí Minh", businessType: "Đại lý",
    estimate: lead.estimate, items: lead.items, page: "/gio-hang", submittedAt: "2026-10-15T00:00:00.000Z" });
  assert.deepEqual(parseLead({ phone: "0901234567" }), { error: "Vui lòng nhập họ tên" });
  assert.deepEqual(parseLead({ name: "A", phone: "0281234567" }), { error: "Số điện thoại di động không hợp lệ" });
});

test("verifyTurnstile: off without secret; token, network errors and both field names", async () => {
  const original = globalThis.fetch;
  const calls: URLSearchParams[] = [];
  try {
    assert.equal(await verifyTurnstile("", "1.1.1.1", ""), true, "disabled when no secret");
    assert.equal(await verifyTurnstile("", "1.1.1.1", "secret"), false, "missing token");
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
      const body = init.body as URLSearchParams; calls.push(body);
      return new Response(JSON.stringify({ success: body.get("response") === "good" }));
    }) as typeof fetch;
    assert.equal(await verifyTurnstile("good", "1.1.1.1", "secret"), true);
    assert.equal(await verifyTurnstile("bad", "1.1.1.1", "secret"), false);
    assert.deepEqual([calls[0].get("secret"), calls[0].get("remoteip")], ["secret", "1.1.1.1"]);
    globalThis.fetch = (async () => { throw new Error("timeout"); }) as typeof fetch;
    assert.equal(await verifyTurnstile("good", "1.1.1.1", "secret"), false, "network error fails closed");
  } finally { globalThis.fetch = original; }
  // The handler reads either `turnstileToken` or the widget's `cf-turnstile-response`.
  const seen: string[] = [];
  const handler = createTenantLeadHandler({
    loadSite: async () => ({ entitlements: entitlements() }), saveLead: async () => ({ id: "x" }), limiter: createRateLimiter(),
    verifyTurnstile: async (token) => { seen.push(token); return token === "ok"; },
  });
  assert.equal((await handler(post(lead("contact", { turnstileToken: "ok" }), "192.0.2.80"))).status, 200);
  assert.equal((await handler(post(lead("contact", { "cf-turnstile-response": "ok", phone: "0901234511" }), "192.0.2.81"))).status, 200);
  assert.equal((await handler(post(lead("contact", { phone: "0901234512" }), "192.0.2.82"))).status, 400);
  assert.deepEqual(seen, ["ok", "ok", ""]);
});

test("site lookup failure → 503 JSON, not an unhandled rejection", async () => {
  const handler = createTenantLeadHandler({
    loadSite: async () => { throw new Error("db down"); }, saveLead: async () => ({ id: "x" }), limiter: createRateLimiter(), verifyTurnstile: async () => true,
  });
  const original = console.error;
  console.error = () => undefined;
  try {
    const response = await handler(post(lead("contact")));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, false);
  } finally { console.error = original; }
});

test("Redis: web instances share the IP/phone quota per tenant and the window resets", {
  skip: !process.env.REDIS_URL && "REDIS_URL missing: requires Redis",
}, async () => {
  const { default: Redis } = await import("ioredis");
  const redis = new Redis(process.env.REDIS_URL!);
  const prefix = `rl:test:${Date.now()}`;
  try {
    // Two limiters = two web processes sharing one Redis.
    const [a, b] = [createRateLimiter({ primary: redisCounter(redis) }), createRateLimiter({ primary: redisCounter(redis) })];
    assert.equal((await a(`${prefix}:t1:ip`, 2, 300)).ok, true);
    assert.equal((await b(`${prefix}:t1:ip`, 2, 300)).ok, true);
    const third = await a(`${prefix}:t1:ip`, 2, 300);
    assert.equal(third.ok, false);
    assert.ok(third.retryAfterSec >= 1);
    assert.equal((await b(`${prefix}:t2:ip`, 2, 300)).ok, true, "other tenant has its own quota");
    await new Promise((resolve) => setTimeout(resolve, 350));
    assert.equal((await a(`${prefix}:t1:ip`, 2, 300)).ok, true, "window reset");
  } finally { await redis.quit(); }
});

test("phone quota uses the normalized number; Redis down still stores the lead via the memory fallback", async (t) => {
  t.mock.method(console, "error", () => {});
  const saved: string[] = [];
  const handler = createTenantLeadHandler({
    loadSite: async () => ({ entitlements: entitlements() }),
    saveLead: async (_t, _s, input) => { saved.push(input.phone); return { id: `l${saved.length}` }; },
    limiter: createRateLimiter({ primary: async () => { throw new Error("Redis down"); } }),
    verifyTurnstile: async () => true,
  });
  const forms = ["0901 234 599", "+84901234599", "84 901 234 599", "0901.234.599", "(090) 1234599", "0901234599"];
  const statuses = [];
  for (const [i, phone] of forms.entries()) statuses.push((await handler(post(lead("contact", { phone }), `198.18.0.${i}`))).status);
  assert.deepEqual(statuses, [...Array(LEAD_LIMITS.phone.limit).fill(200), 429], "equivalent numbers share one quota");
  assert.deepEqual(new Set(saved), new Set(["0901234599"]));
});

test("verifyTurnstile aborts a hanging Siteverify call after its timeout and fails closed", async () => {
  const original = globalThis.fetch;
  let signal: AbortSignal | undefined;
  globalThis.fetch = ((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
    signal = init.signal ?? undefined;
    signal?.addEventListener("abort", () => reject(signal?.reason));
  })) as typeof fetch;
  try {
    const started = Date.now();
    assert.equal(await verifyTurnstile("good", "1.1.1.1", "secret", 20), false);
    assert.ok(signal?.aborted, "request was aborted by the timeout signal");
    assert.ok(Date.now() - started < 2_000);
  } finally { globalThis.fetch = original; }
});

test("rate-limit keys are per tenant: A exhausting its IP and phone quota does not block B", async () => {
  const keys: string[] = [];
  const counter = memoryCounter();
  const handler = createTenantLeadHandler({
    loadSite: async () => ({ entitlements: entitlements() }), saveLead: async () => ({ id: "x" }), verifyTurnstile: async () => true,
    limiter: createRateLimiter({ primary: async (key, windowMs) => { keys.push(key); return counter(key, windowMs); } }),
  });
  const otherTenant = "00000000-0000-4000-8000-0000000000bb";
  const asTenant = (id: string) => post(lead("contact"), "203.0.113.77", { "x-tenant-id": id, "x-site-id": siteId });
  for (let i = 0; i < LEAD_LIMITS.phone.limit; i++) assert.equal((await handler(asTenant(tenantId))).status, 200);
  assert.equal((await handler(asTenant(tenantId))).status, 429);
  assert.equal((await handler(asTenant(otherTenant))).status, 200, "same IP and phone, other tenant");
  assert.ok(keys.includes(`rl:lead:${tenantId}:ip:203.0.113.77`) && keys.includes(`rl:lead:${otherTenant}:phone:0901234500`));
});

test("parseLead bounds: 30 estimate entries, 50 items, qty defaults to 1 and clamps to 1..999", () => {
  const estimate = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`k${i}`, i]));
  const items = Array.from({ length: 60 }, (_, i) => ({ sku: `s${i}`, name: `n${i}`, qty: [undefined, "x", 0, -5, 0.4][i % 5] }));
  const parsed = parseLead({ name: "A", phone: "0901234567", estimate, items });
  assert.ok("lead" in parsed);
  assert.equal(Object.keys(parsed.lead.estimate ?? {}).length, 30);
  assert.equal(parsed.lead.items?.length, 50);
  assert.deepEqual(new Set(parsed.lead.items?.map((item) => item.qty)), new Set([1]));
  const arrayEstimate = parseLead({ name: "A", phone: "0901234567", estimate: [1, 2], items: "x" });
  assert.ok("lead" in arrayEstimate);
  assert.deepEqual([arrayEstimate.lead.estimate, arrayEstimate.lead.items], [undefined, undefined]);
});
