import assert from "node:assert/strict";
import { test } from "node:test";
import { healthResponse } from "../lib/health.ts";
import { GET } from "../app/api/health/route.ts";

test("health 200 checks DB and Redis and is never cached", async () => {
  const response = await healthResponse({ db: async () => undefined, redis: async () => "PONG" });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { status: "ok", db: "ok", redis: "ok" });
});

test("db failure is 503 without details", async t => {
  const log = t.mock.method(console, "error", () => {});
  const response = await healthResponse({ db: async () => { throw Error("postgres://user:password@private/db"); }, redis: async () => "PONG" });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { status: "error", db: "error", redis: "ok" });
  assert.deepEqual(log.mock.calls[0].arguments, ["[health] db error"]);
});

test("runtime error is 503", async t => {
  const secret = process.env.ADMIN_SESSION_SECRET;
  delete process.env.ADMIN_SESSION_SECRET;
  t.after(() => { if (secret !== undefined) process.env.ADMIN_SESSION_SECRET = secret; });
  t.mock.method(console, "error", () => {});
  const response = await GET();
  assert.equal(response.status, 503);
  const body = await response.text();
  assert.equal(JSON.parse(body).db, "error");
  assert.ok(!body.includes("ADMIN_SESSION_SECRET"));
});

test("redis skipped", async () => {
  const response = await healthResponse({ db: async () => undefined });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", db: "ok", redis: "skipped" });
});

test("slow check times out", async t => {
  t.mock.method(console, "error", () => {});
  const start = Date.now();
  const response = await healthResponse({ db: async () => undefined, redis: () => new Promise(() => {}) });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { status: "error", db: "ok", redis: "error" });
  assert.ok(Date.now() - start < 3000);
});
