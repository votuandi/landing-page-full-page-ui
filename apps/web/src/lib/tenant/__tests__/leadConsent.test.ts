import assert from "node:assert/strict";
import test from "node:test";
import { parseLead } from "../../leads/parse";
import { toLeadInput, createTenantLeadHandler } from "../leadIntake";
import { createRateLimiter } from "../rateLimit";

test("parseLead consent: opt-in required, timestamp comes from server and survives intake", () => {
  const base = { name: "[DỮ LIỆU MẪU]", phone: "0901234567" }, now = new Date("2026-10-29T01:02:03Z");
  for (const consent of [undefined, false, "", "false", "off", "no", 0, [], {}]) {
    const result = parseLead({ ...base, consent }, now);
    assert.ok("error" in result); assert.match(result.error, /Vui lòng đồng ý/);
  }
  for (const consent of [true, "on", "true", "1", 1]) {
    const result = parseLead({ ...base, consent, consentAt: "forged" }, now);
    assert.ok("lead" in result);
    assert.equal(result.lead.consentAt, now.toISOString());
    assert.equal(toLeadInput(result.lead).data.consentAt, result.lead.submittedAt);
  }
});
test("tenant API consent: unticked returns 400 and does not persist", async () => {
  let saved = false;
  const handler = createTenantLeadHandler({
    loadSite: async () => ({ entitlements: { planId: "pro", addons: [], status: "active", createdAt: new Date(), disabled: [] } }),
    limiter: createRateLimiter(), saveLead: async () => { saved = true; return { id: "bad" }; }, verifyTurnstile: async () => true,
  });
  const response = await handler(new Request("https://a/api/lead", { method: "POST", headers: { "x-tenant-id": "00000000-0000-4000-8000-000000000001", "x-site-id": "00000000-0000-4000-8000-000000000002" }, body: JSON.stringify({ name: "A", phone: "0901234567", elapsedMs: 3000 }) }));
  assert.equal(response.status, 400); assert.match((await response.json()).message, /Vui lòng đồng ý/); assert.equal(saved, false);
});
