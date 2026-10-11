import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createDb } from "../client.ts";
import { forTenant } from "../repository.ts";

test("get returns null for malformed UUIDs without connecting to Postgres", async () => {
  const db = createDb({ url: "postgresql://localhost:1/unused?connect_timeout=1", pool: 1 });
  try {
    const repo = forTenant(db, randomUUID());
    for (const id of ["", "abc", " ", "00000000-0000-0000-0000-00000000000z", ` ${randomUUID()}`]) {
      assert.equal(await repo.project.get(id), null);
      assert.equal(await repo.sectionContent.get(id), null);
    }
  } finally { await db.$disconnect(); }
});
