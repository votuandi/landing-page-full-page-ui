import assert from "node:assert/strict";
import test from "node:test";
import { signRevalidate, tenantTag } from "@solar/cache";
import { createRevalidateHandler, memoryNonces, redisNonces } from "../revalidate";
import { createRateLimiter, memoryCounter } from "../rateLimit";
const secret = "test-secret", time = 1_000_000;
const tag = tenantTag("00000000-0000-4000-8000-000000000001");
const payload = { tags: [tag], nonce: "unique-nonce-123", ts: time };
function request(value: unknown = payload, signature?: string) {
  const body = JSON.stringify(value);
  return new Request("http://internal/api/revalidate", { method: "POST", body, headers: { "x-signature": signature ?? signRevalidate(body, secret) } });
}
function setup() {
  const invalidated: string[][] = [], next: string[] = [], hosts: string[][] = [];
  const post = createRevalidateHandler({ secret: () => secret, now: () => time, claimNonce: memoryNonces(() => time),
    limit: createRateLimiter({ fallback: memoryCounter(() => time) }), invalidate: async tags => { invalidated.push([...tags]); },
    revalidateTag: tag => { next.push(tag); }, invalidateHosts: async value => { hosts.push(value); } });
  return { post, invalidated, next, hosts };
}
test("revalidate rejects bad signatures, stale/future time, invalid tags/body/hosts, missing secret", async () => {
  const { post, invalidated } = setup();
  assert.equal((await post(request(payload, "0".repeat(64)))).status, 401);
  for (const ts of [time - 300_001, time + 300_001]) assert.equal((await post(request({ ...payload, ts }))).status, 401);
  for (const extra of [{ tags: ["other:x"] }, { tags: [] }, { nonce: "" }, { hosts: ["https://evil/path"] }, { ts: "now" }, { tags: Array(101).fill(tag) }]) {
    assert.equal((await post(request({ ...payload, ...extra }))).status, 400);
  }
  assert.equal((await post(request(null))).status, 400);
  assert.deepEqual(invalidated, []);
  assert.equal((await createRevalidateHandler({ secret: () => undefined })(request())).status, 503);
});
test("valid request invalidates tags and hosts; concurrent nonce replay returns 409", async () => {
  const { post, invalidated, next, hosts } = setup();
  const responses = await Promise.all([post(request({ ...payload, hosts: ["t15.localhost"] })), post(request())]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  assert.deepEqual(invalidated, [[tag]]); assert.deepEqual(next, [tag]); assert.deepEqual(hosts, [["t15.localhost"]]);
  assert.equal(responses[0].headers.get("cache-control"), "no-store");
});
test("revalidate rate limits 120/min before parsing or invalidating", async () => {
  const { post } = setup();
  for (let i = 0; i < 120; i++) assert.equal((await post(request(payload, "bad"))).status, 401);
  const limited = await post(request());
  assert.equal(limited.status, 429); assert.equal(limited.headers.get("retry-after"), "60");
});
test("nonce expiry and Redis atomic NX/PX; Redis failure fails closed", async () => {
  let now = 0;
  const claim = memoryNonces(() => now);
  assert.equal(await claim("nonce"), true); assert.equal(await claim("nonce"), false);
  now = 600_000; assert.equal(await claim("nonce"), true);
  const redis = redisNonces({ set: async (...args: unknown[]) => { assert.deepEqual(args, ["revalidate:nonce:n", "1", "PX", 600_000, "NX"]); return "OK"; } } as never);
  assert.equal(await redis("n"), true);
  const post = createRevalidateHandler({ secret: () => secret, now: () => time, limit: createRateLimiter(), claimNonce: async () => { throw Error("Redis down"); } });
  const original = console.error; console.error = () => {};
  try { assert.equal((await post(request())).status, 503); } finally { console.error = original; }
});
test("body limit rejects large and malformed JSON without invalidation", async () => {
  const { post, invalidated } = setup();
  for (const body of ["x".repeat(65_537), "{"]) {
    const response = await post(new Request("http://internal/api/revalidate", { method: "POST", body, headers: { "x-signature": signRevalidate(body, secret) } }));
    assert.equal(response.status, body.length > 65_536 ? 413 : 400);
  }
  assert.deepEqual(invalidated, []);
});
