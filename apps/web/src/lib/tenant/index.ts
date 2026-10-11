import { EventEmitter } from "node:events";
import { createDb, forPlatform, POOL_BUDGET } from "@solar/db";
import { normalizeHost } from "./host";
import { createRedisCache } from "./redis";
import { createHostResolver, type InvalidationBus } from "./resolver";

const state = globalThis as typeof globalThis & { solarHostResolver?: ReturnType<typeof createHostResolver> };

export function getHostResolver() {
  if (!state.solarHostResolver) {
    if (!process.env.DATABASE_URL) throw new Error("MULTI_TENANT=1 requires DATABASE_URL for tenant resolution");
    const db = createDb({ pool: POOL_BUDGET.web });
    const events = new EventEmitter();
    const localBus: InvalidationBus = {
      publish: async (hosts) => { events.emit("invalidate", hosts); },
      subscribe: (callback) => { events.on("invalidate", callback); },
    };
    const cache = process.env.REDIS_URL ? createRedisCache(process.env.REDIS_URL) : { bus: localBus };
    state.solarHostResolver = createHostResolver({ lookup: forPlatform(db).domains.resolve, ...cache });
  }
  return state.solarHostResolver;
}

export async function invalidateHosts(hostnames: string[]) {
  const normalized = hostnames.map(normalizeHost);
  if (normalized.some((host) => host === null)) throw new Error("Invalid hostname for tenant cache invalidation");
  await getHostResolver().invalidate([...new Set(normalized as string[])]);
}
