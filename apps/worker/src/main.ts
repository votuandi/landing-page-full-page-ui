import { createPlatformDb, forPlatform, POOL_BUDGET } from "@solar/db";
import { startWorker } from "./loop.ts";
import { createLeadDeliver } from "./handlers/leadDeliver.ts";

import { invalidateTopic } from "./handlers/invalidate.ts";

const db = createPlatformDb({ pool: POOL_BUDGET.worker });
const worker = startWorker({
  outbox: forPlatform(db).outbox,
  topics: {
    invalidate: invalidateTopic,
    "lead.deliver": { handle: createLeadDeliver({ db, senders: {} }) },
  },
});
console.log("[worker] đang chạy");

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => void worker.stop().then(() => process.exit(0)));
}
