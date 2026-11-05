import assert from "node:assert/strict";
import test from "node:test";
import { createAbViewHandler } from "../abView";
import { createRateLimiter } from "../rateLimit";
import type { SiteEntitlements } from "../siteData";

const tenantId = "e8000000-0000-4000-8000-000000000001", siteId = "e8000000-0000-4000-8000-000000000002", id = "e8000000-0000-4000-8000-000000000003";
const request = (body = JSON.stringify({ t: id, v: "B" }), headers: Record<string, string> = { "x-tenant-id": tenantId, "x-site-id": siteId }) => new Request("http://a.localhost/api/ab", { method: "POST", headers, body });
test("POST ab: 204, 400 malformed, 404 absent tenant/site/ended/foreign, 403 pro/kill switch, 429 rate limit", async () => {
  let planId = "premium", disabled: string[] = [], exists = true, saved = 0;
  const handler = createAbViewHandler({
    loadSite: async () => ({ entitlements: { planId, disabled, addons: [], status: "active", createdAt: new Date("2026-01-01") } as SiteEntitlements }),
    record: async (t, s, testId, variant) => { assert.deepEqual([t, s, testId, variant], [tenantId, siteId, id, "B"]); saved++; return exists; },
    limiter: createRateLimiter(),
  });
  const ok = await handler(request()); assert.equal(ok.status, 204); assert.equal(await ok.text(), ""); assert.equal(ok.headers.get("set-cookie"), null);
  for (const body of ["{", "null", "[]", JSON.stringify({ t: id, v: "C" }), JSON.stringify({ t: "bad", v: "B" })]) assert.equal((await handler(request(body))).status, 400);
  assert.equal((await handler(request(undefined, {}))).status, 404);
  planId = "pro"; assert.equal((await handler(request())).status, 403);
  planId = "premium"; disabled = ["abTest"]; assert.equal((await handler(request())).status, 403);
  disabled = []; exists = false; assert.equal((await handler(request())).status, 404);
  assert.equal(saved, 2);
  const limited = createAbViewHandler({ loadSite: async () => { throw Error("must not query"); }, record: async () => true,
    limiter: async (key, limit, ms) => { assert.equal(key, `rl:ab:${tenantId}:ip:unknown`); assert.equal(limit, 30); assert.equal(ms, 60_000); return { ok: false, retryAfterSec: 60 }; } });
  const response = await limited(request()); assert.equal(response.status, 429); assert.equal(response.headers.get("retry-after"), "60");
});
