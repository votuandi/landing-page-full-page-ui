import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { forTenant, type OutboxJob, type PlatformDb } from "@solar/db";
import { ChannelError, type MailSender } from "@solar/leads";
import { createEmailNotifier, createLogNotifier, createNotify } from "../handlers/notify.ts";
import { PermanentError } from "../loop.ts";

test("notify routes tenant/kind/payload and stable idempotency key; rejects malformed or cross-tenant jobs", async () => {
  const tenantId = randomUUID();
  const job: OutboxJob = { id: "job", tenantId, topic: "notify.plan-changed", payload: { tenantId, from: "pro", to: "basic" },
    idempotencyKey: "notify.plan-changed:audit", attempts: 1, createdAt: new Date(), runAt: new Date() };
  const sent: unknown[] = [];
  const handle = createNotify({ notifier: { send: async input => { sent.push(input); } } });
  await handle(job);
  assert.deepEqual(sent, [{ tenantId, kind: "plan-changed", payload: job.payload, idempotencyKey: job.idempotencyKey }]);
  for (const invalid of [{ ...job, payload: {} }, { ...job, payload: { tenantId: randomUUID() } }, { ...job, tenantId: null }, { ...job, topic: "lead.deliver" }]) {
    await assert.rejects(handle(invalid), PermanentError);
  }
  assert.equal(sent.length, 1);
  await assert.rejects(createNotify({ notifier: { send: async () => { throw Error("offline"); } } })(job), /offline/);
});

test("billing notifications preserve renewal milestone, expiry, tenant and deduplication key", async () => {
  const tenantId = randomUUID(), expiresAt = "2040-01-15T12:00:00.000Z";
  const sent: unknown[] = [];
  const handle = createNotify({ notifier: { send: async input => { sent.push(input); } } });
  for (const [kind, payload, key] of [
    ["renewal", { tenantId, days: 7, expiresAt }, `renewal:${tenantId}:${expiresAt}:7`],
    ["suspended", { tenantId, expiresAt }, `suspended:${tenantId}:${expiresAt}`],
  ] as const) {
    await handle({ id: randomUUID(), tenantId, topic: `notify.${kind}`, payload, idempotencyKey: key,
      attempts: 1, createdAt: new Date(), runAt: new Date() });
    assert.deepEqual(sent.at(-1), { tenantId, kind, payload, idempotencyKey: key });
  }
  assert.equal(sent.length, 2);
});

const tenantId = randomUUID(), db = {} as PlatformDb;
const owners = ["a", "b"].map(id => ({ id, email: `${id}@example.vn`, tenant: { name: "[DỮ LIỆU MẪU] Solar" } }));
const repository = (() => ({ siteUser: { list: async () => owners } })) as unknown as typeof forTenant;
const notice = (kind = "renewal", payload: Record<string, unknown> = { days: 7, expiresAt: "2040-01-15T12:00:00Z" }) => ({ tenantId, kind, payload, idempotencyKey: "notify:job" });

test("per owner key: second owner failure retries stable bodies and keys", async () => {
  const deliveries: { mail: unknown; key: string }[] = [];
  let fail = true;
  const send: MailSender = async (mail, key) => {
    deliveries.push({ mail, key });
    if (mail.to === "b@example.vn" && fail) { fail = false; throw new ChannelError("offline"); }
  };
  const notifier = createEmailNotifier(db, send, repository);
  await assert.rejects(notifier.send(notice()), /offline/);
  await notifier.send(notice());
  assert.deepEqual(deliveries.map(row => row.key), ["notify:job:a", "notify:job:b", "notify:job:a", "notify:job:b"]);
  assert.deepEqual(deliveries.slice(0, 2), deliveries.slice(2));
});

test("domain warning reaches owner with hostname and reason", async () => {
  const deliveries: string[] = [];
  await createEmailNotifier(db, async mail => { deliveries.push(mail.text); }, repository)
    .send(notice("domain-warning", { hostname: "solar.vn", reason: "Thiếu DNS" }));
  assert.equal(deliveries.length, 2);
  for (const body of deliveries) { assert.match(body, /solar.vn/); assert.match(body, /Thiếu DNS/); }
});

test("per owner key remains stable when owner membership changes between retries", async () => {
  let currentOwners = owners;
  const changingRepository = (() => ({ siteUser: { list: async () => currentOwners } })) as unknown as typeof forTenant;
  const sent: { mail: unknown; key: string }[] = [];
  const notifier = createEmailNotifier(db, async (mail, key) => { sent.push({ mail, key }); }, changingRepository);
  await notifier.send(notice());
  currentOwners = [owners[1], { ...owners[0], id: "c", email: "c@example.vn" }];
  await notifier.send(notice());
  assert.deepEqual(sent.map(row => row.key), ["notify:job:a", "notify:job:b", "notify:job:b", "notify:job:c"]);
  assert.deepEqual(sent[1], sent[2]);
});

test("bad notify payload and unknown kind are permanent before repository access", async () => {
  const unreachable = (() => { assert.fail("invalid payload reached DB"); }) as unknown as typeof forTenant;
  const notifier = createEmailNotifier(db, async () => { assert.fail("invalid payload sent"); }, unreachable);
  for (const input of [notice("unknown"), notice("renewal", { days: "7", expiresAt: "2040-01-15T12:00:00Z" }),
    notice("renewal", { days: -1, expiresAt: "wrong" }), notice("renewal", {}), notice("suspended", { expiresAt: "private" }),
    notice("plan-changed", { from: "basic" }), notice("domain-warning", { hostname: "solar.vn" })]) {
    await assert.rejects(notifier.send(input), error => error instanceof PermanentError && !error.message.includes("private"));
  }
});

test("notification provider permanent errors go dead; transient errors retry", async () => {
  for (const permanent of [true, false]) {
    const error = new ChannelError("Email: dịch vụ trả mã 400", permanent);
    await assert.rejects(createEmailNotifier(db, async () => { throw error; }, repository).send(notice()),
      received => permanent ? received instanceof PermanentError : received === error);
  }
});

test("logs no address: fallback and empty recipient list only emit metadata", async t => {
  const logs: unknown[][] = [];
  t.mock.method(console, "log", (...args: unknown[]) => { logs.push(args); });
  await createLogNotifier(db, repository).send(notice());
  const empty = (() => ({ siteUser: { list: async () => [] } })) as unknown as typeof forTenant;
  await createEmailNotifier(db, async () => { assert.fail("no owner"); }, empty).send(notice());
  const text = JSON.stringify(logs);
  assert.ok(logs.length >= 2);
  assert.doesNotMatch(text, /@example|expiresAt|2040-01|days/);
  assert.match(text, /tenantId/);
});
