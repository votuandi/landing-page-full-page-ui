export { createDb, POOL_BUDGET } from "./client.ts";
export type { Db } from "./client.ts";
export { assertNoCrossTenantConnect } from "./tenantGuard.ts";
export { assertRefsBelongToTenant, CrossTenantRefError } from "./refs.ts";
export type { CollectionName, TenantRefs, RefDb } from "./refs.ts";
export { Prisma } from "../generated/client.ts";
export type { PrismaClient } from "../generated/client.ts";
