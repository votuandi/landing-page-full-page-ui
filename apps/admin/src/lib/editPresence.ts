type Editor = { accountId: string; name: string };
export function createPresence({ ttl = 60_000, now = Date.now }: { ttl?: number; now?: () => number } = {}) {
  const pages = new Map<string, Map<string, Editor & { expires: number }>>();
  return {
    touch(key: string, clientId: string, editor: Editor): string[] {
      const time = now();
      for (const [pageKey, clients] of pages) {
        for (const [id, entry] of clients) if (entry.expires <= time) clients.delete(id);
        if (!clients.size) pages.delete(pageKey);
      }
      const clients = pages.get(key) ?? new Map<string, Editor & { expires: number }>();
      clients.set(clientId, { ...editor, expires: time + ttl }); pages.set(key, clients);
      return [...clients].filter(([id]) => id !== clientId).map(([, entry]) => entry.accountId === editor.accountId ? "Bạn (tab khác)" : entry.name);
    },
  };
}
const globalPresence = globalThis as typeof globalThis & { builderPresence?: ReturnType<typeof createPresence> };
export const editPresence = globalPresence.builderPresence ??= createPresence();
