import assert from "node:assert/strict";
import test from "node:test";
import { createBuilderQueue } from "../lib/builderQueue.ts";
test("hàng đợi ghi đọc revision mới nhất", async () => {
  const queue = createBuilderQueue(2), seen: number[] = [];
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const a = queue.write(async revision => { seen.push(revision); await gate; return { ok: true, revision: revision + 1 }; });
  const b = queue.write(async revision => { seen.push(revision); return { ok: true, revision: revision + 1 }; });
  await Promise.resolve(); assert.deepEqual(seen, [2]); release();
  await Promise.all([a, b]); assert.deepEqual(seen, [2, 3]);
});
test("409 khóa hàng đợi, lỗi kết nối cho phép thử lại", async () => {
  const queue = createBuilderQueue(2);
  assert.equal((await queue.write(async () => { throw new Error("offline"); })).ok, false);
  assert.equal((await queue.write(async revision => ({ ok: true, revision: revision + 1 }))).ok, true);
  assert.equal((await queue.write(async () => ({ ok: false, status: 409, error: "Xung đột" }))).status, 409);
  let called = false;
  assert.equal((await queue.write(async () => { called = true; return { ok: true }; })).status, 409);
  assert.equal(called, false);
});
