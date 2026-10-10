export const LAST_ESTIMATE_KEY = "t15-last-estimate";
const MAX_AGE_MS = 30 * 86_400_000;

export type SavedEstimate = {
  savedAt: number;
  segment: string;
  estimate: Record<string, string | number | boolean>;
};

export function sanitizeSavedEstimate(raw: unknown, now: number, maxAgeMs = MAX_AGE_MS): SavedEstimate | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const { savedAt, segment, estimate } = raw as Partial<SavedEstimate>;
  if (typeof savedAt !== "number" || !Number.isFinite(savedAt) || savedAt <= 0 || savedAt > now || now - savedAt > maxAgeMs ||
    typeof segment !== "string" || !estimate || typeof estimate !== "object" || Array.isArray(estimate)) return null;
  if (!Object.values(estimate).every((value) => typeof value === "string" || typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value)))) return null;
  return { savedAt, segment, estimate };
}

export function saveLastEstimate(value: SavedEstimate): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(LAST_ESTIMATE_KEY, JSON.stringify(value));
  } catch { /* Storage bị chặn: dự toán vẫn chạy. */ }
}

export function readLastEstimate(maxAgeMs = MAX_AGE_MS): SavedEstimate | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(LAST_ESTIMATE_KEY);
    return raw ? sanitizeSavedEstimate(JSON.parse(raw), Date.now(), maxAgeMs) : null;
  } catch { return null; }
}
