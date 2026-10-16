import { createHash } from "node:crypto";

type Count = { count: number; resetMs: number };
export interface Counter {
  get(key: string): Promise<Count>;
  increment(key: string, windowMs: number, sliding?: boolean): Promise<Count>;
  delete(key: string): Promise<void>;
}
export function memoryCounter(now = Date.now): Counter {
  const windows = new Map<string, { count: number; reset: number }>();
  function read(key: string): Count {
    const value = windows.get(key);
    if (!value || value.reset <= now()) { windows.delete(key); return { count: 0, resetMs: 0 }; }
    return { count: value.count, resetMs: value.reset - now() };
  }
  return {
    async get(key) { return read(key); },
    async increment(key, windowMs, sliding = false) {
      if (windows.size > 10_000) for (const [k, value] of windows) if (value.reset <= now()) windows.delete(k);
      const current = read(key);
      windows.set(key, { count: current.count + 1, reset: now() + (sliding ? windowMs : current.resetMs || windowMs) });
      return read(key);
    },
    async delete(key) { windows.delete(key); },
  };
}
const readScript = "return {tonumber(redis.call('GET',KEYS[1])) or 0,redis.call('PTTL',KEYS[1])}";
const incrementScript = "local c=redis.call('INCR',KEYS[1]) if c==1 or ARGV[2]=='1' then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end return {c,redis.call('PTTL',KEYS[1])}";
export function redisCounter(client: { eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<unknown> }): Counter {
  async function run(script: string, key: string, windowMs?: number, sliding = false): Promise<Count> {
    const result = await client.eval(script, 1, key, ...(windowMs === undefined ? [] : [windowMs, sliding ? 1 : 0]));
    if (!Array.isArray(result) || result.length !== 2 || !Number.isFinite(Number(result[0])) || !Number.isFinite(Number(result[1]))) throw new Error("Invalid Redis counter result");
    return { count: Number(result[0]), resetMs: Math.max(0, Number(result[1])) };
  }
  return {
    get: key => run(readScript, key),
    increment: (key, ms, sliding) => run(incrementScript, key, ms, sliding),
    async delete(key) { await client.eval("return redis.call('DEL',KEYS[1])", 1, key); },
  };
}
export type LoginAttempt = { realm: "site" | "platform"; tenantId?: string; identifier: string; ip: string };
export function createLoginLimiter({ primary, fallback = memoryCounter(), maxFailures = 5, lockMs = 900_000, ipLimit = 30, ipWindowMs = 900_000 }: {
  primary?: Counter; fallback?: Counter; maxFailures?: number; lockMs?: number; ipLimit?: number; ipWindowMs?: number;
} = {}) {
  for (const value of [maxFailures, lockMs, ipLimit, ipWindowMs]) if (!Number.isInteger(value) || value < 1) throw new Error("Invalid login limiter options");
  const digest = (value: string) => createHash("sha256").update(value).digest("hex");
  const keys = (input: LoginAttempt) => [
    `auth:fail:${input.realm}:${input.tenantId ?? "-"}:${digest(input.identifier)}`,
    `auth:ip:${input.realm}:${digest(input.ip)}`,
  ];
  async function read(key: string) {
    const local = await fallback.get(key);
    try {
      const shared = primary ? await primary.get(key) : local;
      return { count: Math.max(local.count, shared.count), resetMs: Math.max(local.resetMs, shared.resetMs) };
    } catch { return local; }
  }
  async function increment(key: string, ms: number, sliding = false) {
    // Use the atomic increment's result; a later read would lose this request's reservation.
    const local = await fallback.increment(key, ms, sliding);
    if (primary) try {
      const shared = await primary.increment(key, ms, sliding);
      return { count: Math.max(local.count, shared.count), resetMs: Math.max(local.resetMs, shared.resetMs) };
    } catch { /* Local counter remains active. */ }
    return local;
  }
  return {
    async check(input: LoginAttempt): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
      const [account, ip] = await Promise.all(keys(input).map(read));
      const wait = Math.max(account.count >= maxFailures ? account.resetMs : 0, ip.count >= ipLimit ? ip.resetMs : 0);
      return wait > 0 ? { ok: false, retryAfterSec: Math.max(1, Math.ceil(wait / 1000)) } : { ok: true };
    },
    async reserve(input: LoginAttempt): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
      const [accountKey, ipKey] = keys(input);
      const [account, ip] = await Promise.all([increment(accountKey, lockMs, true), increment(ipKey, ipWindowMs)]);
      const wait = Math.max(account.count > maxFailures ? account.resetMs : 0, ip.count > ipLimit ? ip.resetMs : 0);
      return wait > 0 ? { ok: false, retryAfterSec: Math.max(1, Math.ceil(wait / 1000)) } : { ok: true };
    },
    async fail(input: LoginAttempt) { const [account, ip] = keys(input); await Promise.all([increment(account, lockMs, true), increment(ip, ipWindowMs)]); },
    async succeed(input: LoginAttempt) {
      const [account] = keys(input);
      await fallback.delete(account);
      if (primary) try { await primary.delete(account); } catch { /* Local counter was cleared. */ }
    },
  };
}
export type LoginLimiter = ReturnType<typeof createLoginLimiter>;
