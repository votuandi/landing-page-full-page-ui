import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createDb, createLead, createPlatformDb, forPlatform, forTenant, type OutboxJob } from "@solar/db";
import { runOnce } from "../loop.ts";
import { createLeadDeliver, type LeadSender } from "../handlers/leadDeliver.ts";

const skip = !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL) && "DATABASE_URL/PLATFORM_DATABASE_URL missing: requires migrated PostgreSQL 16";
const MIN = 60_000;

/** Records every delivery; an idempotent channel drops repeated keys like a real one would. */
function channel(supportsIdempotency: boolean, failures = 0) {
  const received: string[] = [];
  const sender: LeadSender = {
    supportsIdempotency,
    async send({ idempotencyKey }) {
      if (failures-- > 0) throw new Error("HTTP 500");
      if (!supportsIdempotency || !received.includes(idempotencyKey)) received.push(idempotencyKey);
    },
  };
  return { sender, received };
}

test("Postgres outbox: retries, worker crash, concurrent workers and dead jobs (E11-S01)", { skip }, async () => {
  const db = createDb({ pool: 2 }), platform = createPlatformDb({ pool: 4 });
  const outbox = forPlatform(platform).outbox;
  const tenantId = randomUUID(), siteId = randomUUID();
  await platform.tenant.create({ data: { id: tenantId, slug: `outbox-${tenantId}`, name: "[DỮ LIỆU MẪU] Outbox", planId: "pro", status: "active" } });
  try {
    await platform.site.create({ data: { id: siteId, tenantId, name: "Outbox", themeId: "t15" } });
    const [webhook, telegram, sheets] = await Promise.all((["webhook", "telegram", "google_sheets"] as const).map((kind) =>
      platform.leadIntegration.create({ data: { tenantId, kind, name: kind, configEncrypted: "test" } })));
    await platform.leadIntegration.create({ data: { tenantId, kind: "webhook", name: "off", enabled: false, configEncrypted: "test" } });

    // Lead + one job per enabled channel are committed before createLead resolves (the API answers 200 after this).
    const { id: leadId, jobs } = await createLead(db, tenantId, siteId, { source: "contact", name: "A", phone: "0901234567", data: { page: "/" } });
    assert.equal(jobs, 3);
    assert.ok(await forTenant(db, tenantId).lead.get(leadId));
    const queued = await forTenant(db, tenantId).outbox.list({ orderBy: { idempotencyKey: "asc" } });
    assert.deepEqual(queued.map((j) => j.idempotencyKey).sort(), [webhook, telegram, sheets].map((i) => `lead.deliver:${leadId}:${i.id}`).sort());

    const idempotent = channel(true, 2), plain = channel(false);
    const topics = { "lead.deliver": { handle: createLeadDeliver({ db: platform, senders: { webhook: idempotent.sender, telegram: plain.sender } }) } };
    let clock = Date.now();
    const now = () => new Date(clock);

    // Worker A claims everything, delivers to both channels, then dies before marking the jobs done.
    const stale = await outbox.claim({ tenantId, leaseMs: MIN, now: now() });
    assert.equal(stale.length, 3);
    const byKind = (jobsList: OutboxJob[], id: string) => jobsList.find((j) => (j.payload as { integrationId: string }).integrationId === id)!;
    await plain.sender.send({ lead: {} as never, integration: {} as never, idempotencyKey: `${leadId}:${telegram.id}` });
    idempotent.received.push(`${leadId}:${webhook.id}`);
    // Lease still valid: nobody else can take them.
    assert.equal(await runOnce({ outbox, topics, tenantId, now }), 0);

    // Lease expired → two workers poll at once; SKIP LOCKED gives each job to exactly one of them.
    clock += 2 * MIN;
    const counts = await Promise.all([runOnce({ outbox, topics, tenantId, now }), runOnce({ outbox, topics, tenantId, now })]);
    assert.equal(counts[0] + counts[1], 3);
    // The dead worker waking up cannot overwrite the re-claimed jobs.
    assert.equal(await outbox.complete(byKind(stale, telegram.id)), false);

    // webhook: HTTP 500 twice, then delivered; google_sheets has no sender yet → dead immediately.
    for (let i = 0; i < 3; i++) { clock += 30 * MIN; await runOnce({ outbox, topics, tenantId, now }); }
    const rows = await forTenant(db, tenantId).outbox.list();
    const status = (id: string) => rows.find((r) => (r.payload as { integrationId: string }).integrationId === id)!;
    assert.equal(status(webhook.id).status, "done");
    assert.equal(status(telegram.id).status, "done");
    assert.equal(status(sheets.id).status, "failed");
    assert.match(status(sheets.id).lastError ?? "", /chưa hỗ trợ kênh google_sheets/);
    // Exactly once on the idempotent channel, at least once (here twice) on the other.
    assert.deepEqual(idempotent.received, [`${leadId}:${webhook.id}`]);
    assert.deepEqual(plain.received, [`${leadId}:${telegram.id}`, `${leadId}:${telegram.id}`]);
    const audit = await forTenant(db, tenantId).auditLog.list({ where: { action: "outbox.dead" } });
    assert.equal(audit.length, 1);

    // "Gửi lại" revives only this tenant's dead job.
    assert.equal(await outbox.resend({ tenantId: randomUUID(), id: status(sheets.id).id }), false);
    assert.equal(await outbox.resend({ tenantId, id: status(sheets.id).id }), true);
    assert.equal((await forTenant(db, tenantId).outbox.get(status(sheets.id).id))?.status, "pending");

    // A job past its max age goes dead instead of retrying; jobs with maxAgeMs Infinity keep retrying.
    await outbox.enqueue([{ tenantId, topic: "test.retry", payload: {}, idempotencyKey: `test.retry:${tenantId}` }]);
    assert.equal(await outbox.enqueue([{ tenantId, topic: "test.retry", payload: {}, idempotencyKey: `test.retry:${tenantId}` }]), 0, "duplicate key is ignored");
    const failing = { "test.retry": { handle: async () => { throw new Error("down"); }, maxAgeMs: Infinity } };
    clock = Date.now() + 48 * 60 * MIN;
    await runOnce({ outbox, topics: failing, tenantId, now });
    assert.equal((await forTenant(db, tenantId).outbox.first({ where: { topic: "test.retry" } }))?.status, "pending");

    // Default 24 h window: just before it a failure retries, after it the job goes dead.
    const flaky = { "lead.deliver": { handle: createLeadDeliver({ db: platform, senders: { webhook: channel(false, 100).sender } }) } };
    const { id: lateLead } = await createLead(db, tenantId, siteId, { source: "contact", name: "B", phone: "0901234568", data: {} });
    const late = await forTenant(db, tenantId).outbox.first({ where: { idempotencyKey: `lead.deliver:${lateLead}:${webhook.id}` } });
    assert.ok(late);
    await platform.outbox.updateMany({ where: { idempotencyKey: { startsWith: `lead.deliver:${lateLead}:` }, NOT: { id: late.id } }, data: { status: "done" } });
    clock = late.createdAt.getTime() + 24 * 60 * MIN - MIN;
    await runOnce({ outbox, topics: flaky, tenantId, now });
    assert.equal((await forTenant(db, tenantId).outbox.get(late.id))?.status, "pending", "inside 24 h → retry");
    clock = late.createdAt.getTime() + 24 * 60 * MIN + 10 * MIN;
    await runOnce({ outbox, topics: flaky, tenantId, now });
    assert.equal((await forTenant(db, tenantId).outbox.get(late.id))?.status, "failed", "past 24 h → dead");

    // "Gửi lại" opens a fresh 24 h window: one transient error retries instead of going dead again.
    clock += 60 * MIN;
    assert.equal(await outbox.resend({ tenantId, id: late.id, now: now() }), true);
    const resendAudit = await forTenant(db, tenantId).auditLog.first({ where: { action: "outbox.resend", entityId: late.id } });
    assert.equal((resendAudit?.data as { previousCreatedAt?: string } | null)?.previousCreatedAt, late.createdAt.toISOString());
    await runOnce({ outbox, topics: flaky, tenantId, now });
    assert.equal((await forTenant(db, tenantId).outbox.get(late.id))?.status, "pending");

    // A worker that claimed before the resend cannot overwrite the new claim (lease token = runAt, not attempts).
    clock += 7 * 60 * MIN;
    const [fresh] = await outbox.claim({ tenantId, topics: ["lead.deliver"], now: now() });
    assert.equal(fresh?.id, late.id);
    const stale2 = { ...fresh, runAt: new Date(fresh.runAt.getTime() - 5 * 60 * MIN) };
    assert.equal(await outbox.complete(stale2), false);
    await outbox.fail(stale2, new Error("old"), { dead: true });
    assert.equal((await forTenant(db, tenantId).outbox.get(late.id))?.status, "processing", "stale worker changed nothing");
    assert.equal(await outbox.complete(fresh), true);

    // Delivery stays inside the job's tenant: a forged payload pointing at another tenant's rows → dead, sender untouched.
    const spy = channel(true);
    const guarded = { "lead.deliver": { handle: createLeadDeliver({ db: platform, senders: { webhook: spy.sender } }) } };
    const otherTenant = randomUUID();
    await platform.tenant.create({ data: { id: otherTenant, slug: `outbox-b-${otherTenant}`, name: "[DỮ LIỆU MẪU] B", planId: "pro", status: "active" } });
    try {
      const foreignHook = await platform.leadIntegration.create({ data: { tenantId: otherTenant, kind: "webhook", name: "B", configEncrypted: "test" } });
      await outbox.enqueue([
        { tenantId: otherTenant, topic: "lead.deliver", payload: { leadId, integrationId: webhook.id }, idempotencyKey: `forged:${otherTenant}` },
        { tenantId, topic: "lead.deliver", payload: { leadId, integrationId: foreignHook.id }, idempotencyKey: `leadA-hookB:${tenantId}` },
        { tenantId: otherTenant, topic: "lead.deliver", payload: { leadId, integrationId: foreignHook.id }, idempotencyKey: `leadA-hookB-as-B:${otherTenant}` },
        { tenantId, topic: "lead.deliver", payload: { leadId: "nope" }, idempotencyKey: `bad:${tenantId}` },
        { tenantId, topic: "lead.deliver", payload: { leadId: randomUUID(), integrationId: webhook.id }, idempotencyKey: `deleted:${tenantId}` },
        { tenantId: null, topic: "lead.deliver", payload: { leadId, integrationId: webhook.id }, idempotencyKey: `no-tenant:${tenantId}` },
      ]);
      await runOnce({ outbox, topics: guarded, tenantId: otherTenant, now });
      await runOnce({ outbox, topics: guarded, tenantId, now });
      // The tenant-less job is only reachable without a tenant filter; claim it by its key.
      const [orphan] = await platform.outbox.findMany({ where: { idempotencyKey: `no-tenant:${tenantId}` } });
      await guarded["lead.deliver"].handle({ ...orphan, payload: orphan.payload } as never).then(() => assert.fail("must reject"), (error) => assert.match(String(error), /payload không hợp lệ/));
      await platform.outbox.delete({ where: { id: orphan.id } });
      assert.deepEqual(spy.received, []);
      for (const key of [`forged:${otherTenant}`, `leadA-hookB:${tenantId}`, `leadA-hookB-as-B:${otherTenant}`, `bad:${tenantId}`, `deleted:${tenantId}`]) {
        assert.equal((await platform.outbox.findUniqueOrThrow({ where: { idempotencyKey: key } })).status, "failed", key);
      }
    } finally { await platform.tenant.delete({ where: { id: otherTenant } }); }

    // Channel turned off after the lead arrived: job completes without sending.
    const { id: offLead } = await createLead(db, tenantId, siteId, { source: "contact", name: "C", phone: "0901234569", data: {} });
    await platform.leadIntegration.update({ where: { id: webhook.id }, data: { enabled: false } });
    await platform.outbox.updateMany({ where: { idempotencyKey: { startsWith: `lead.deliver:${offLead}:` }, NOT: { idempotencyKey: `lead.deliver:${offLead}:${webhook.id}` } }, data: { status: "done" } });
    await runOnce({ outbox, topics: guarded, tenantId, now });
    assert.equal((await platform.outbox.findUniqueOrThrow({ where: { idempotencyKey: `lead.deliver:${offLead}:${webhook.id}` } })).status, "done");
    assert.deepEqual(spy.received, []);

  } finally {
    await platform.lead.deleteMany({ where: { tenantId } });
    await platform.tenant.delete({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), platform.$disconnect()]);
  }
});
