type SessionStorage = Pick<Storage, "getItem" | "setItem">;
const KEY = "t15-consult-shown";

/** Memory preserves the once-per-session rule when storage is blocked. */
export function createConsultSession() {
  let shown = false;
  return {
    shouldAutoOpen(storage: SessionStorage, otherDialogOpen: boolean) {
      if (shown || otherDialogOpen) return false;
      try { return storage.getItem(KEY) !== "1"; } catch { return true; }
    },
    markShown(storage: SessionStorage) {
      shown = true;
      try { storage.setItem(KEY, "1"); } catch { /* Storage may be blocked. */ }
    },
  };
}
