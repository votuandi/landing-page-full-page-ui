import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createPlatformDb, forPlatform } from "@solar/db";
import type { Mail } from "@solar/leads";
import { createEmailNotifier, createNotify } from "../handlers/notify.ts";
import { runOnce } from "../loop.ts";

const skip = !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL) && "DATABASE_URL/PLATFORM_DATABASE_URL missing: requires migrated PostgreSQL 16";

test("email notifier: only reachable owners of tenant; suspended tenant still receives notifications", { skip }, async () => {
  const db = createPlatformDb({ pool: 2 });
  const tenantId = randomUUID(), otherId = randomUUID(), emptyId = randomUUID();
  const tenants = [tenantId, otherId, emptyId];
  try {
    for (const id of tenants) await db.tenant.create({ data: { id, slug: `notify-${id}`, name: "[DỮ LIỆU MẪU] Notify", planId: "pro", status: "suspended" } });
    const owner = await db.siteUser.create({ data: { tenantId, name: "[DỮ LIỆU MẪU] Owner", email: "owner@example.vn", role: "owner", status: "active" } });
    for (const data of [
      { tenantId, email: "disabled@example.vn", role: "owner", status: "disabled" },
      { tenantId, email: null, role: "owner", status: "active" },
      { tenantId, email: "staff@example.vn", role: "staff", status: "active" },
      { tenantId, email: "client@example.vn", role: "client", status: "active" },
      { tenantId: otherId, email: "other@example.vn", role: "owner", status: "active" },
      { tenantId: emptyId, email: "disabled@example.vn", role: "owner", status: "disabled" },
    ] as const) await db.siteUser.create({ data: { ...data, name: "[DỮ LIỆU MẪU] Excluded" } });
    const sent: { mail: Mail; key: string }[] = [];
    const handle = createNotify({ notifier: createEmailNotifier(db, async (mail, key) => { sent.push({ mail, key }); }) });
    const outbox = forPlatform(db).outbox;
    for (const id of [tenantId, emptyId]) await outbox.enqueue([
      { tenantId: id, topic: "notify.suspended", payload: { tenantId: id, expiresAt: "2040-01-15T12:00:00Z" }, idempotencyKey: `suspended:${id}` },
    ]);
    const now = () => new Date(Date.now() + 1000);
    for (const id of [tenantId, emptyId]) {
      assert.equal(await runOnce({ outbox, tenantId: id, now, topics: { "notify.suspended": { handle } } }), 1);
      const rows = await db.outbox.findMany({ where: { tenantId: id, topic: "notify.suspended" } });
      assert.equal(rows[0]?.status, "done");
    }
    assert.equal(sent.length, 1);
    assert.equal(sent[0].mail.to, "owner@example.vn");
    assert.equal(sent[0].key, `suspended:${tenantId}:${owner.id}`);
    assert.match(sent[0].mail.text, /tạm khóa/);

    // A forged job must not even reach the owner lookup of another tenant.
    await assert.rejects(handle({ id: randomUUID(), tenantId, topic: "notify.suspended", attempts: 1, createdAt: now(), runAt: now(),
      idempotencyKey: "forged", payload: { tenantId: otherId, expiresAt: "2040-01-15T12:00:00Z" } }));
    assert.equal(sent.length, 1);
  } finally {
    await db.tenant.deleteMany({ where: { id: { in: tenants } } });
    await db.$disconnect();
  }
});
