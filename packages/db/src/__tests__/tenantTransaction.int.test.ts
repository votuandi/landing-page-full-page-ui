import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createDb, withTenantTransaction } from "../index.ts";

const skip = !process.env.DATABASE_URL && "DATABASE_URL missing: requires migrated PostgreSQL 16";

// E11-S03 CI: a busy admin pool (5) made getSession fail after Prisma's default 2 s maxWait and crashed whole pages (P2028).
test("a transaction waits for a busy pool beyond 2 s instead of failing", { skip }, async () => {
  const db = createDb({ pool: 1 }), tenantId = randomUUID();
  try {
    const release = new Promise(resolve => setTimeout(resolve, 3_000));
    const holder = withTenantTransaction(db, tenantId, async () => { await release; });
    await new Promise(resolve => setTimeout(resolve, 100));
    await assert.doesNotReject(withTenantTransaction(db, tenantId, async () => undefined));
    await holder;
  } finally { await db.$disconnect(); }
});
