import { createDb, forPlatform, POOL_BUDGET } from "@solar/db";
import { createRealm, createLoginLimiter, redisCounter } from "@solar/auth";
import { siteStore } from "@solar/auth/db";
import Redis from "ioredis";
import { createHostResolver } from "./host.ts";

function createRuntime() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error("ADMIN_SESSION_SECRET cần ít nhất 32 byte");
  const platform = process.env.PLATFORM_DOMAIN;
  if (!platform || !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(platform)) throw new Error("PLATFORM_DOMAIN không hợp lệ");
  const db = createDb({ pool: POOL_BUDGET.admin });
  const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    enableOfflineQueue: true, maxRetriesPerRequest: 0, commandTimeout: 500, connectTimeout: 1000,
  }).on("error", () => undefined) : undefined;
  const limiter = createLoginLimiter({ primary: redis ? redisCounter(redis) : undefined });
  const realm = createRealm({ name: "site", secret, sessionTtl: 7 * 86400_000, idleTtl: 12 * 3600_000,
    secure: process.env.NODE_ENV === "production", store: siteStore(db, { audience: "admin" }), limiter });
  return { db, realm, limiter, secret, platform,
    resolveHost: createHostResolver(slug => forPlatform(db).tenants.bySlug(slug), platform),
    async close() { redis?.disconnect(); await db.$disconnect(); },
  };
}
// No DB/Redis connection is created on import; one runtime survives Next hot reloads.
const state = globalThis as typeof globalThis & { solarAdminRuntime?: ReturnType<typeof createRuntime> };
export function getRuntime() { return state.solarAdminRuntime ??= createRuntime(); }
