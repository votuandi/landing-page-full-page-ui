import assert from "node:assert/strict";
import test from "node:test";
import { createPresence } from "../lib/editPresence.ts";

test("presence bỏ chính clientId; cùng accountId hiện Bạn (tab khác); hết TTL biến mất", () => {
  let now = 0;
  const p = createPresence({ now: () => now });
  const a = { accountId: "a", name: "An" }, b = { accountId: "b", name: "Bình" }, key = "tenant:a:page:one";
  assert.deepEqual(p.touch(key, "tab-a", a), []);
  assert.deepEqual(p.touch(key, "tab-b", b), ["An"]);
  assert.deepEqual(p.touch(key, "tab-c", a), ["Bạn (tab khác)", "Bình"]);
  now = 59_999; assert.deepEqual(p.touch(key, "tab-b", b), ["An", "An"]);
  now = 60_000; assert.deepEqual(p.touch(key, "tab-b", b), []);
});
test("presence khóa tenant/page tách biệt, TTL tùy chỉnh và heartbeat gia hạn", () => {
  let now = 0;
  const p = createPresence({ ttl: 100, now: () => now }), a = { accountId: "a", name: "An" };
  p.touch("tenant:a:page:one", "a", a);
  assert.deepEqual(p.touch("tenant:b:page:one", "b", a), []);
  assert.deepEqual(p.touch("tenant:a:page:two", "b", a), []);
  now = 90; p.touch("tenant:a:page:one", "a", a);
  now = 100; assert.deepEqual(p.touch("tenant:a:page:one", "b", a), ["Bạn (tab khác)"]);
  now = 190; assert.deepEqual(p.touch("tenant:a:page:one", "b", a), []);
});
