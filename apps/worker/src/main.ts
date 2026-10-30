import { createPlatformDb, forPlatform, POOL_BUDGET, findLeadSender, demoteSendingDomain } from "@solar/db";
import { loadEnv, workerEnv } from "@solar/env";
import { createLeadSenders, sendMail, senderFrom, type MailSender } from "@solar/leads";
import { every, startWorker } from "./loop.ts";
import { startBillingCron } from "./billing.ts";
import { createLeadDeliver } from "./handlers/leadDeliver.ts";
import { createEmailNotifier, createLogNotifier, createNotify } from "./handlers/notify.ts";
import { createMailSend } from "./handlers/mail.ts";

import { invalidateTopic } from "./handlers/invalidate.ts";
import { createMediaRuntime } from "./mediaRuntime.ts";

const env = loadEnv(workerEnv);
const db = createPlatformDb({ pool: POOL_BUDGET.worker });
const send: MailSender = (mail, key) => sendMail(mail, key, env);
const emailConfigured = Boolean(env.RESEND_API_KEY && env.MAIL_FROM);
if (!emailConfigured) console.warn("[worker] Thiếu RESEND_API_KEY / MAIL_FROM: notify chỉ ghi metadata; mail.send sẽ retry.");
const notify = createNotify({ notifier: emailConfigured ? createEmailNotifier(db, send) : createLogNotifier(db) });
const overrideExpiry = every(5 * 60_000, () => forPlatform(db).tenants.scanExpiredOverrides({ now: new Date() }));
const billing = startBillingCron(forPlatform(db).billing);
const sectionCleanup = every(6 * 60 * 60_000, () => forPlatform(db).sectionContents.purgeRemoved({ now: new Date() }));
const media = createMediaRuntime(db);
const mediaCleanup = every(60 * 60_000, media.cleanup);
const mediaOrphans = every(7 * 24 * 60 * 60_000, media.orphans);
const worker = startWorker({
  outbox: forPlatform(db).outbox,
  topics: {
    invalidate: invalidateTopic,
    "media.scan": { handle: media.scan },
    "media.publish": { handle: media.publish },
    "lead.deliver": { handle: createLeadDeliver({ db, senders: createLeadSenders(env), senderFor: async tenantId => {
      const row = await findLeadSender(db, tenantId);
      return row ? { hostname: row.hostname, from: senderFrom(row.name, row.hostname), onRejected: () => demoteSendingDomain(db, tenantId, row.hostname) } : null;
    } }) },
    "mail.send": { handle: createMailSend({ send }), redact: true },
    "notify.plan-changed": { handle: notify },
    "notify.renewal": { handle: notify },
    "notify.suspended": { handle: notify },
    "notify.domain-warning": { handle: notify },
  },
});
console.log("[worker] đang chạy");

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => void Promise.all([worker.stop(), overrideExpiry.stop(), billing.stop(), sectionCleanup.stop(), mediaCleanup.stop(), mediaOrphans.stop()]).then(() => db.$disconnect()).then(() => process.exit(0)));
}
