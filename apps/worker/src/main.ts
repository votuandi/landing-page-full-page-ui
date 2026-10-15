import { createPlatformDb, forPlatform, POOL_BUDGET } from "@solar/db";
import { every, startWorker } from "./loop.ts";
import { startBillingCron } from "./billing.ts";
import { createLeadDeliver } from "./handlers/leadDeliver.ts";
import { createLogNotifier, createNotify } from "./handlers/notify.ts";

import { invalidateTopic } from "./handlers/invalidate.ts";

const db = createPlatformDb({ pool: POOL_BUDGET.worker });
const notify = createNotify({ notifier: createLogNotifier(db) });
const overrideExpiry = every(5 * 60_000, () => forPlatform(db).tenants.scanExpiredOverrides({ now: new Date() }));
const billing = startBillingCron(forPlatform(db).billing);
const worker = startWorker({
  outbox: forPlatform(db).outbox,
  topics: {
    invalidate: invalidateTopic,
    "lead.deliver": { handle: createLeadDeliver({ db, senders: {} }) },
    "notify.plan-changed": { handle: notify },
    "notify.renewal": { handle: notify },
    "notify.suspended": { handle: notify },
  },
});
console.log("[worker] đang chạy");

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => void Promise.all([worker.stop(), overrideExpiry.stop(), billing.stop()]).then(() => db.$disconnect()).then(() => process.exit(0)));
}
