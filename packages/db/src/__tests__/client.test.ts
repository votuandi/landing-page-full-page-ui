import assert from "node:assert/strict";
import test from "node:test";
import { createDb, POOL_BUDGET } from "../client.ts";

test("client requires an explicit positive pool budget and a database URL", async () => {
  assert.deepEqual(POOL_BUDGET, { web: 10, admin: 5, worker: 5 });
  assert.throws(() => createDb({ url: "", pool: 5 }), /DATABASE_URL/);
  for (const pool of [0, -1, 1.5, NaN]) {
    assert.throws(() => createDb({ url: "postgresql://localhost/db", pool }), /positive integer/);
  }
  const db = createDb({ url: "postgresql://localhost/db", pool: POOL_BUDGET.worker });
  await db.$disconnect();
});
