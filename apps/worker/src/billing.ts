import { every } from "./loop.ts";

export function startBillingCron(billing: { run(options: { now: Date }): Promise<unknown> }) {
  return every(60 * 60_000, () => billing.run({ now: new Date() }));
}
