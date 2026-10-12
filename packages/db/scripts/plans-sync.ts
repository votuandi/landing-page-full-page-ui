import { createDb } from "../src/client.ts";
import { syncPlans } from "../src/plans.ts";

let db: ReturnType<typeof createDb> | undefined;
try {
  if (process.argv.length > 2) throw new Error("plans:sync does not accept arguments");
  db = createDb({ pool: 2 });
  await syncPlans(db);
  console.log("Synced basic, pro, premium from @solar/plans");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally { await db?.$disconnect(); }
