import assert from "node:assert/strict";
import test from "node:test";
import { tenantTag, verifyRevalidate } from "@solar/cache";
import type { OutboxJob } from "@solar/db";
import { createInvalidate, invalidateTopic } from "../handlers/invalidate.ts";
import { runOnce } from "../loop.ts";
const job: OutboxJob = { id: "job", topic: "invalidate", tenantId: null, payload: { tags: [tenantTag("00000000-0000-4000-8000-000000000001")] }, idempotencyKey: "invalidate:key", attempts: 1, createdAt: new Date(0), runAt: new Date(0) };
test("web offline twice retries forever then completes; every endpoint receives fresh signed nonces", async t => {
  const errors = t.mock.method(console, "error", () => {});
  let attempt = 0, status = "pending", nextRun = 0;
  const bodies: string[] = [], visited: string[] = [];
  const handle = createInvalidate({ urls: () => "http://web-1/api/revalidate,http://web-2/api/revalidate", secret: () => "secret", now: () => 2 * 86_400_000,
    fetch: async (url, init) => {
      visited.push(String(url)); const body = String(init?.body); bodies.push(body);
      assert.ok(verifyRevalidate(body, new Headers(init?.headers).get("x-signature")!, "secret"));
      assert.equal(new Headers(init?.headers).get("x-idempotency-key"), job.idempotencyKey);
      assert.ok(init?.signal); if (attempt < 3) throw Error("ECONNREFUSED"); return new Response("ok");
    } });
  const outbox = {
    async claim() { attempt++; return status === "pending" ? [job] : []; },
    async complete() { status = "done"; return true; },
    async fail(_job: OutboxJob, _error: unknown, options: { maxAgeMs?: number; dead?: boolean } = {}) {
      assert.equal(options.maxAgeMs, Infinity); assert.equal(options.dead, false);
      status = "pending"; nextRun += 30_000; return "retry" as const;
    },
  };
  const topics = { invalidate: { ...invalidateTopic, handle } };
  for (let i = 0; i < 2; i++) { await runOnce({ outbox, topics }); assert.equal(status, "pending"); }
  assert.equal(nextRun, 60_000);
  await runOnce({ outbox, topics }); assert.equal(status, "done");
  assert.equal(errors.mock.callCount(), 2);
  assert.equal(new Set(bodies.map(body => JSON.parse(body).nonce)).size, 6);
  assert.deepEqual(visited, Array(3).fill(["http://web-1/api/revalidate", "http://web-2/api/revalidate"]).flat());
});
test("any non-2xx or missing config retries; a partial success is safe to resend", async t => {
  t.mock.method(console, "error", () => {});
  const handle = createInvalidate({ urls: () => "http://web/api/revalidate", secret: () => "secret", fetch: async () => new Response("no", { status: 503 }) });
  await assert.rejects(handle(job));
  await assert.rejects(createInvalidate({ urls: () => "", secret: () => "secret" })(job));
  await assert.rejects(createInvalidate({ urls: () => "http://web/api/revalidate", secret: () => undefined })(job));
});
