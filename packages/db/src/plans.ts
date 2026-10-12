import { PLAN_IDS, plans } from "@solar/plans";
import type { Db } from "./client.ts";

// Global platform configuration; tenant content is untouched.
export async function syncPlans(db: Pick<Db, "$transaction">): Promise<void> {
  await db.$transaction(async tx => {
    for (const id of PLAN_IDS) {
      const plan = plans[id];
      const data = { name: plan.name, features: [...plan.features], limits: { ...plan.limits }, syncedAt: new Date() };
      await tx.plan.upsert({ where: { id }, create: { id, ...data }, update: data });
    }
  });
}
