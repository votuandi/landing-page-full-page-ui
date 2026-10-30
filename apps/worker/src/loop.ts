import type { OutboxJob } from "@solar/db";

/** Retrying cannot help (unknown channel, deleted lead): the job goes dead at once and waits for "Gửi lại". */
export class PermanentError extends Error {
  override name = "PermanentError";
}

export type Topic = {
  handle: (job: OutboxJob) => Promise<void>;
  /** Age after which a failing job goes dead; default 24 h. `Infinity` = retry forever (cache invalidation). */
  maxAgeMs?: number;
  /** Remove sensitive payload only once the job is done or dead. */
  redact?: boolean;
};
type Outbox = {
  claim(options: { limit?: number; leaseMs?: number; topics?: readonly string[]; tenantId?: string; now?: Date }): Promise<OutboxJob[]>;
  complete(job: OutboxJob, options?: { now?: Date; redact?: boolean }): Promise<boolean>;
  fail(job: OutboxJob, error: unknown, options?: { now?: Date; maxAgeMs?: number; dead?: boolean; redact?: boolean }): Promise<"dead" | "retry">;
};
export type RunOptions = { outbox: Outbox; topics: Readonly<Record<string, Topic>>; now?: () => Date; limit?: number; leaseMs?: number; tenantId?: string };

/** One poll: claim due jobs (SKIP LOCKED, so workers never share a job) and settle each one. */
export async function runOnce({ outbox, topics, now = () => new Date(), limit, leaseMs, tenantId }: RunOptions) {
  const jobs = await outbox.claim({ limit, leaseMs, topics: Object.keys(topics), tenantId, now: now() });
  // allSettled: a failing complete/fail (DB blip) must not end the batch while other handlers are still sending.
  const results = await Promise.allSettled(jobs.map(async (job) => {
    const topic = topics[job.topic];
    try {
      await topic.handle(job);
      await outbox.complete(job, { now: now(), redact: topic.redact });
    } catch (error) {
      await outbox.fail(job, error, { now: now(), maxAgeMs: topic.maxAgeMs, dead: error instanceof PermanentError, redact: topic.redact });
    }
  }));
  const failed = results.find((result) => result.status === "rejected");
  if (failed) throw failed.reason;
  return jobs.length;
}

/** Polls until `stop()`; a full batch polls again at once. `stop()` waits for the batch in flight. */
export function startWorker({ intervalMs = 1_000, ...options }: RunOptions & { intervalMs?: number }) {
  let stopped = false, timer: NodeJS.Timeout | undefined;
  let running: Promise<unknown> = Promise.resolve();
  const tick = () => {
    running = runOnce(options).then(
      (count) => count >= (options.limit ?? 10) ? 0 : intervalMs,
      (error) => { console.error("[worker] poll lỗi", error); return intervalMs; },
    ).then((delay) => { if (!stopped) timer = setTimeout(tick, delay); });
  };
  tick();
  return { async stop() { stopped = true; clearTimeout(timer); await running; } };
}

/** Run now, then wait after completion: slow scans never overlap and failures do not stop the schedule. */
export function every(ms: number, task: () => Promise<unknown>) {
  let stopped = false, timer: NodeJS.Timeout | undefined;
  let running: Promise<unknown> = Promise.resolve();
  const tick = () => {
    running = Promise.resolve().then(task).catch(error => { console.error("[worker] cron lỗi", error); })
      .then(() => { if (!stopped) timer = setTimeout(tick, ms); });
  };
  tick();
  return { async stop() { stopped = true; clearTimeout(timer); await running; } };
}
