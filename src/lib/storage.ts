/**
 * localStorage an toàn: mọi lệnh đọc/ghi bọc try/catch. Khi trình duyệt chặn storage
 * (chế độ riêng tư, hết dung lượng, cookie bị chặn) thì tự dùng bộ nhớ tạm trong trang —
 * website vẫn hoạt động, chỉ không giữ dữ liệu sau khi tải lại.
 */
const memory = new Map<string, string>();

function store(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const s = window.localStorage;
    const probe = "__t13_probe__";
    s.setItem(probe, probe);
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = store()?.getItem(key) ?? memory.get(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try { store()?.setItem(key, raw); } catch {}
}

export function removeKey(key: string) {
  memory.delete(key);
  try { store()?.removeItem(key); } catch {}
}

export const STORAGE_KEYS = {
  quoteCart: "t13-quote-cart",
  lastEstimate: "t13-last-estimate",
} as const;
