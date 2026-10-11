import type { HostRecord } from "@solar/db";
import { z } from "zod";

export type HostLookup = (hostname: string) => Promise<HostRecord | null>;
export type SharedStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSec: number): Promise<void>;
  del(keys: string[]): Promise<void>;
};
export type InvalidationBus = {
  publish(hostnames: string[]): Promise<void>;
  // An empty list signals a reconnect and clears all local state.
  subscribe(callback: (hostnames: string[]) => void): void;
};
const snapshotSchema = z.object({
  expiresAt: z.number().finite(),
  record: z.object({
    hostname: z.string(), tenantId: z.string().min(1), siteId: z.string().min(1),
    status: z.enum(["pending", "verified", "active", "error", "removed"]), isPrimary: z.boolean(),
    tenantStatus: z.enum(["trial", "active", "suspended"]), primaryHost: z.string().nullable(),
  }).nullable(),
});
type Snapshot = z.infer<typeof snapshotSchema>;
const key = (hostname: string) => `tenancy:host:${hostname}`;

export function createHostResolver({ lookup, store, bus, memoryTtlMs = 60_000, sharedTtlSec = 300, now = Date.now }: {
  lookup: HostLookup; store?: SharedStore; bus?: InvalidationBus;
  memoryTtlMs?: number; sharedTtlSec?: number; now?: () => number;
}) {
  const memory = new Map<string, Snapshot>();
  const pending = new Map<string, Promise<HostRecord | null>>();
  let generation = 0, warned = false;
  const warn = () => {
    if (!warned) console.warn("Tenant cache unavailable; falling back to PostgreSQL.");
    warned = true;
  };
  function clear(hostnames: string[]) {
    generation++;
    if (!hostnames.length) memory.clear();
    else hostnames.forEach((host) => memory.delete(host));
    pending.clear();
  }
  try { bus?.subscribe(clear); } catch { warn(); }
  function remember(hostname: string, snapshot: Snapshot) {
    memory.delete(hostname);
    if (memory.size >= 10_000) memory.delete(memory.keys().next().value!);
    memory.set(hostname, snapshot);
  }
  async function load(hostname: string): Promise<HostRecord | null> {
    const started = now(), version = generation;
    let snapshot: Snapshot | undefined;
    if (store) {
      try {
        const raw = await store.get(key(hostname));
        if (raw !== null) {
          const parsed = snapshotSchema.safeParse(JSON.parse(raw));
          if (parsed.success && parsed.data.expiresAt > now() &&
            parsed.data.expiresAt <= now() + memoryTtlMs &&
            (!parsed.data.record || parsed.data.record.hostname === hostname)) snapshot = parsed.data;
        }
      } catch { warn(); }
    }
    if (!snapshot) {
      const record = await lookup(hostname);
      if (generation !== version) return resolve(hostname);
      // Preserve DB snapshot age across Redis and instances, including negative entries.
      snapshot = { record, expiresAt: started + memoryTtlMs };
      if (store) {
        try { await store.set(key(hostname), JSON.stringify(snapshot), sharedTtlSec); } catch { warn(); }
        if (generation !== version) {
          try { await store.del([key(hostname)]); } catch { warn(); }
          return resolve(hostname);
        }
      }
    }
    if (generation !== version) return resolve(hostname);
    remember(hostname, snapshot);
    return snapshot.record;
  }
  async function resolve(hostname: string): Promise<HostRecord | null> {
    const cached = memory.get(hostname);
    if (cached && cached.expiresAt > now()) return cached.record;
    memory.delete(hostname);
    const existing = pending.get(hostname);
    if (existing) return existing;
    const promise = load(hostname);
    pending.set(hostname, promise);
    try { return await promise; }
    finally { if (pending.get(hostname) === promise) pending.delete(hostname); }
  }
  async function invalidate(hostnames: string[]) {
    if (!hostnames.length) return;
    clear(hostnames);
    try { await store?.del(hostnames.map(key)); } catch { warn(); }
    try { await bus?.publish(hostnames); } catch { warn(); }
    clear(hostnames);
  }
  return { resolve, invalidate };
}
