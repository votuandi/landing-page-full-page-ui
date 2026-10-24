import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createDb, createPlatformDb, forTenant } from "@solar/db";
import { listMedia } from "../lib/mediaLibrary.ts";

test("lists only host tenant media, newest 50 with library fields", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 1 }), a = randomUUID(), b = randomUUID();
  try {
    for (const tenantId of [a, b]) {
      await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "basic", status: "active" } });
      for (let i = 0; i < (tenantId === a ? 51 : 1); i++) await forTenant(db, tenantId).media.create({
        key: `quarantine/${tenantId}/${randomUUID()}`, driver: "local", mime: "image/png", size: 100, status: "quarantine", createdAt: new Date(1_000_000 + i * 1000),
      });
    }
    const aRows = await listMedia(db, a), bRows = await listMedia(db, b);
    assert.equal(aRows.length, 50); assert.equal(bRows.length, 1);
    const aIds = new Set(aRows.map(r => r.id)); assert.ok(!aIds.has(bRows[0].id));
    assert.equal(aRows[0].createdAt.getTime(), 1_050_000); assert.equal(aRows[49].createdAt.getTime(), 1_001_000);
    for (const row of aRows) { assert.equal("key" in row, false); assert.equal(row.mime, "image/png"); assert.equal(row.size, 100); }
  } finally {
    await ops.tenant.deleteMany({ where: { id: { in: [a, b] } } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});
