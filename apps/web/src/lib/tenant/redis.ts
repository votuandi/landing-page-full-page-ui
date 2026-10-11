import Redis from "ioredis";
import { z } from "zod";
import type { InvalidationBus, SharedStore } from "./resolver";

const channel = "tenancy:host:invalidate";
const messageSchema = z.array(z.string());

// One command connection and one subscriber per app instance.
export function createRedisCache(url: string) {
  const options = { enableOfflineQueue: false, maxRetriesPerRequest: 0, commandTimeout: 1_000, connectTimeout: 1_000 };
  const command = new Redis(url, options);
  const subscriber = new Redis(url, { ...options, autoResubscribe: false });
  const callbacks = new Set<(hosts: string[]) => void>();
  const emit = (hosts: string[]) => callbacks.forEach((callback) => callback(hosts));
  let subscribed = false;
  let markReady!: () => void;
  const ready = new Promise<void>((resolve) => { markReady = resolve; });
  const checkReady = () => { if (subscribed && command.status === "ready") markReady(); };
  async function waitForCommand() {
    if (command.status === "ready") return;
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); command.off("ready", connected); command.off("error", failed); };
      const connected = () => { cleanup(); resolve(); };
      const failed = () => { cleanup(); reject(new Error("Tenant cache command connection unavailable")); };
      const timer = setTimeout(failed, 1_000);
      command.once("ready", connected);
      command.once("error", failed);
    });
  }
  function reset() { subscribed = false; emit([]); }
  command.on("error", () => emit([]));
  command.on("close", () => emit([]));
  command.on("ready", () => { emit([]); checkReady(); });
  subscriber.on("error", reset);
  subscriber.on("close", reset);
  subscriber.on("ready", () => {
    void subscriber.subscribe(channel).then(() => {
      subscribed = true;
      emit([]); // Pub/sub messages during the gap were lost.
      checkReady();
    }).catch(reset);
  });
  subscriber.on("message", (receivedChannel, message) => {
    if (receivedChannel !== channel) return;
    try {
      const parsed = messageSchema.safeParse(JSON.parse(message));
      if (parsed.success) emit(parsed.data);
    } catch { /* Ignore malformed messages on the private Redis channel. */ }
  });
  const store: SharedStore = {
    async get(key) {
      if (!subscribed) throw new Error("Tenant cache subscriber unavailable");
      return command.get(key);
    },
    async set(key, value, ttlSec) { await command.set(key, value, "EX", ttlSec); },
    async del(keys) { if (keys.length) { await waitForCommand(); await command.del(...keys); } },
  };
  const bus: InvalidationBus = {
    async publish(hostnames) { await waitForCommand(); await command.publish(channel, JSON.stringify(hostnames)); },
    subscribe(callback) { callbacks.add(callback); },
  };
  return { store, bus, ready, close() { subscriber.disconnect(); command.disconnect(); } };
}
