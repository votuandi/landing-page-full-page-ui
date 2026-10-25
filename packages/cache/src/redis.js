// @ts-check
import { createHash, randomUUID } from "node:crypto";
import { ReadableStream } from "node:stream/web";
import { setTimeout as delay } from "node:timers/promises";
import Redis from "ioredis";

/** @typedef {{value: ReadableStream<Uint8Array>, tags: string[], stale: number, timestamp: number, expire: number, revalidate: number}} CacheEntry */
/** @typedef {ReturnType<typeof createRedisCore>} RedisCore */
const channel = "cache:invalidate";
const tagTtl = 8 * 86_400_000;
const invalidateScript = `
  for _, key in ipairs(KEYS) do
    local old = tonumber(redis.call('GET', key)) or 0
    redis.call('SET', key, math.max(old, tonumber(ARGV[1])), 'PX', ARGV[2])
  end
  redis.call('PUBLISH', ARGV[3], ARGV[4])
  return 1`;
const unlockScript = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end`;

/**
 * One command connection and subscriber per process; pub/sub is only an L1 eviction hint.
 * @param {string} url
 * @param {{now?: () => number, skewMs?: number, log?: (message: string) => void}} [options]
 */
export function createRedisCore(url, { now = Date.now, skewMs = 1000, log = console.warn } = {}) {
  const options = { enableOfflineQueue: false, maxRetriesPerRequest: 0, commandTimeout: 300, connectTimeout: 300 };
  const command = new Redis(url, options);
  const subscriber = new Redis(url, { ...options, autoResubscribe: false, connectionName: `solar-cache-${randomUUID()}` });
  /** @type {Set<(tags: string[]) => void>} */
  const invalidations = new Set();
  /** @type {Set<() => void>} */
  const resets = new Set();
  let lastWarning = -Infinity;
  function warn() {
    if (now() - lastWarning < 60_000) return;
    lastWarning = now();
    log("[cache] Redis unavailable; rendering without cache");
  }
  const reset = () => resets.forEach(fn => fn());
  let floor = Infinity;
  let initialized = Promise.resolve();
  /** @type {Promise<unknown> | undefined} */
  let waiting;
  let commandReady = false, subscribed = false;
  /** @type {() => void} */
  let markReady;
  const ready = new Promise(resolve => { markReady = () => resolve(undefined); });
  const checkReady = () => { if (commandReady && subscribed) markReady(); };
  for (const connection of [command, subscriber]) {
    connection.on("error", reset);
    connection.on("close", reset);
  }
  command.on("close", () => { commandReady = false; floor = Infinity; });
  command.on("ready", () => {
    reset();
    initialized = command.info("server").then(info => {
      const uptime = /^uptime_in_seconds:(\d+)\r?$/m.exec(info)?.[1];
      if (uptime === undefined) throw Error("Redis uptime unavailable");
      floor = now() - Number(uptime) * 1000 + 1000;
      commandReady = true;
      checkReady();
    }).catch(() => { floor = Infinity; warn(); });
  });
  subscriber.on("close", () => { subscribed = false; });
  subscriber.on("ready", () => {
    reset();
    void subscriber.subscribe(channel).then(() => { subscribed = true; reset(); checkReady(); }).catch(() => { reset(); warn(); });
  });
  subscriber.on("message", (received, message) => {
    if (received !== channel) return;
    try {
      const tags = JSON.parse(message);
      if (Array.isArray(tags) && tags.every(tag => typeof tag === "string")) invalidations.forEach(fn => fn(tags));
    } catch { /* Ignore malformed messages from the private Redis channel. */ }
  });
  async function available() {
    if (command.status !== "ready") {
      waiting ??= new Promise((resolve, reject) => {
        const cleanup = () => { clearTimeout(timer); command.off("ready", connected); command.off("error", failed); };
        const connected = () => { cleanup(); resolve(undefined); };
        const failed = () => { cleanup(); reject(Error("Redis unavailable")); };
        const timer = setTimeout(failed, 350);
        command.once("ready", connected); command.once("error", failed);
      }).finally(() => { waiting = undefined; });
      await waiting;
    }
    await initialized;
    if (!commandReady || !Number.isFinite(floor)) throw Error("Redis unavailable");
  }
  return {
    command, subscriber, ready, now, warn, available,
    get floor() { return floor; },
    set floor(value) { floor = value; },
    /** @param {(tags: string[]) => void} fn */
    onInvalidate(fn) { invalidations.add(fn); },
    /** @param {() => void} fn */
    onReset(fn) { resets.add(fn); },
    /** @param {readonly string[]} tags */
    async expiration(tags) {
      await available();
      const clocks = tags.length ? await command.mget(...tags.map(tag => `tag:${tag}:invalidatedAt`)) : [];
      return Math.max(floor, ...clocks.map(value => Number(value) || 0));
    },
    /** @param {readonly string[]} tags */
    async invalidate(tags) {
      await available();
      await command.eval(invalidateScript, tags.length, ...tags.map(tag => `tag:${tag}:invalidatedAt`), now() + skewMs, tagTtl, channel, JSON.stringify(tags));
    },
    close() { subscriber.disconnect(); command.disconnect(); },
  };
}

/** Shared even when Next imports this file natively and app code bundles its own copy. @param {string} url */
export function getRedisCore(url) {
  const key = Symbol.for("solar.cache.redis");
  const state = /** @type {typeof globalThis & {[key: symbol]: RedisCore | undefined}} */ (globalThis);
  return state[key] ??= createRedisCore(url);
}

/** @param {RedisCore} core */
export function createUseCacheHandler(core) {
  /** @type {Map<string, string>} */
  const tokens = new Map();
  /** @param {string} key */
  const hash = key => createHash("sha256").update(key).digest("hex");
  /** @param {string} id @param {string | undefined} token */
  async function release(id, token) {
    if (!token) return;
    if (tokens.get(id) === token) tokens.delete(id);
    await core.command.eval(unlockScript, 1, `lock:${id}`, token);
  }
  /** @param {string} id */
  async function acquire(id) {
    const token = randomUUID();
    if (!await core.command.set(`lock:${id}`, token, "PX", 15_000, "NX")) return false;
    tokens.set(id, token);
    // A render may die without set(); retain local ownership no longer than the Redis lease.
    setTimeout(() => { if (tokens.get(id) === token) tokens.delete(id); }, 15_000).unref();
    return true;
  }
  /** @param {string} id @param {string[]} softTags @returns {Promise<CacheEntry | undefined>} */
  async function read(id, softTags) {
    const [meta, value] = await core.command.hmgetBuffer(`uc:${id}`, "meta", "value");
    if (!meta || !value) return undefined;
    const entry = /** @type {Omit<CacheEntry, 'value'>} */ (JSON.parse(meta.toString()));
    if (!(entry.timestamp > await core.expiration([...entry.tags, ...softTags])) || core.now() >= entry.timestamp + entry.expire * 1000) return undefined;
    return { ...entry, value: new ReadableStream({ start(controller) { controller.enqueue(value); controller.close(); } }) };
  }
  return {
    /** @param {string} key @param {string[]} softTags */
    async get(key, softTags) {
      try {
        await core.available();
        const id = hash(key);
        const entry = await read(id, softTags);
        if (entry) {
          if (core.now() > entry.timestamp + entry.revalidate * 1000 && !await acquire(id)) {
            return { ...entry, revalidate: Math.ceil((core.now() - entry.timestamp) / 1000) + 1 };
          }
          return entry;
        }
        if (await acquire(id)) return undefined;
        const deadline = Date.now() + 5000;
        while (Date.now() < deadline) {
          await delay(50);
          const fresh = await read(id, softTags);
          if (fresh) return fresh;
          if (await acquire(id)) return undefined;
        }
        return undefined;
      } catch { core.warn(); return undefined; }
    },
    /** @param {string} key @param {Promise<CacheEntry>} pending */
    async set(key, pending) {
      const id = hash(key), token = tokens.get(id);
      try {
        const entry = await pending;
        const [callerStream, storedStream] = entry.value.tee();
        entry.value = callerStream;
        const meta = { tags: entry.tags, stale: entry.stale, timestamp: entry.timestamp, expire: entry.expire, revalidate: entry.revalidate };
        /** @type {Uint8Array[]} */
        const chunks = [];
        for await (const chunk of storedStream) chunks.push(chunk);
        await core.available();
        const ttl = Math.ceil(meta.timestamp + meta.expire * 1000 - core.now());
        if (ttl <= 0) return;
        await core.command.multi().hset(`uc:${id}`, "meta", JSON.stringify(meta), "value", Buffer.concat(chunks)).pexpire(`uc:${id}`, ttl).exec();
      } catch { core.warn(); }
      finally { try { await release(id, token); } catch { core.warn(); } }
    },
    async refreshTags() {},
    /** @param {string[]} tags */
    async getExpiration(tags) {
      try { return await core.expiration(tags); } catch { core.warn(); return Infinity; }
    },
    /** @param {string[]} tags */
    async updateTags(tags) { await core.invalidate(tags); },
  };
}
