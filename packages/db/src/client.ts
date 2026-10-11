import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client.ts";
import { assertNoCrossTenantConnect } from "./tenantGuard.ts";

// Across all instances: total < max_connections - 20 (reserve for operations).
export const POOL_BUDGET = { web: 10, admin: 5, worker: 5 } as const;

export function createDb({ url = process.env.DATABASE_URL, pool }: { url?: string; pool: number }) {
  if (!url) throw new Error("DATABASE_URL is required to connect to Postgres");
  if (!Number.isInteger(pool) || pool < 1) throw new Error("pool must be a positive integer");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: pool }) }).$extends({
    name: "tenant-connect-guard",
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          assertNoCrossTenantConnect(model, operation, args);
          return query(args);
        },
      },
    },
  });
}

export type Db = ReturnType<typeof createDb>;
