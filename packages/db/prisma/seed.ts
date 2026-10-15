import { pathToFileURL } from "node:url";
import { createPlatformDb, POOL_BUDGET } from "../src/client.ts";
import { seedDemo } from "./seed-demo.ts";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = createPlatformDb({ pool: POOL_BUDGET.worker });
  try { await seedDemo(db); } finally { await db.$disconnect(); }
}
