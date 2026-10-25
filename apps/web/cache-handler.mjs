import { createRequire } from "node:module";
import { createUseCacheHandler, getRedisCore } from "@solar/cache/redis";

const require = createRequire(import.meta.url);
// Next loads this file with native import(), outside its bundler.
export default process.env.REDIS_URL
  ? createUseCacheHandler(getRedisCore(process.env.REDIS_URL))
  : require("next/dist/server/lib/cache-handlers/default.external.js").default;
