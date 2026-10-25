import assert from "node:assert/strict";
import { test } from "node:test";
import { healthResponse } from "../health";

test("health 200 checks DB and Redis and is never cached", async () => {
  const response = await healthResponse({ db: async () => undefined, redis: async () => "PONG" });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { status: "ok", db: "ok", redis: "ok" });
});

test("db failure is 503 without details, including synchronous errors", async t => {
  const log = t.mock.method(console, "error", () => {});
  for (const db of [() => { throw Error("postgres://user:password@private/db"); }, async () => { throw Error("isolated app_runtime required"); }]) {
    const response = await healthResponse({ db, redis: async () => "PONG" });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await response.json(), { status: "error", db: "error", redis: "ok" });
  }
  for (const call of log.mock.calls) assert.deepEqual(call.arguments, ["[health] db error"]);
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
  assert.ok(Date.now() - start < 3000, "bounded by the 2 second check timeout");
});

test("checks run concurrently and a later failure is observed", async t => {
  t.mock.method(console, "error", () => {});
  let release!: () => void;
  let down = false;
  const checks = {
    db: async () => { await new Promise<void>(resolve => { release = resolve; }); if (down) throw Error("down"); },
    redis: async () => { release(); },
  };
  assert.equal((await healthResponse(checks)).status, 200);
  down = true;
  assert.equal((await healthResponse(checks)).status, 503);
});
