import { createDb, POOL_BUDGET, type Db } from "@solar/db";

const state = globalThis as typeof globalThis & { solarWebDb?: Db };
export function getWebDb() {
  if (!process.env.DATABASE_URL) throw new Error("MULTI_TENANT=1 requires DATABASE_URL");
  return state.solarWebDb ??= createDb({ pool: POOL_BUDGET.web });
}
