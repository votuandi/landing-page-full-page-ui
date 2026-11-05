import type { EditableSection } from "@solar/cms-ui";

export const HISTORY_LIMIT = 100;
export type HistoryStep = { kind: "sections"; before: EditableSection[]; after: EditableSection[] }
  | { kind: "content"; sectionId: string; before: unknown; after: unknown };
export type History = { past: HistoryStep[]; future: HistoryStep[] };
export const emptyHistory: History = { past: [], future: [] };
export function record(h: History, step: HistoryStep): History {
  if (JSON.stringify(step.before) === JSON.stringify(step.after)) return h;
  return { past: [...h.past, structuredClone(step)].slice(-HISTORY_LIMIT), future: [] };
}
export async function travel(h: History, dir: "undo" | "redo", apply: (step: HistoryStep, target: unknown) => Promise<{ ok: boolean }>): Promise<History> {
  const source = dir === "undo" ? h.past : h.future, step = source.at(-1);
  if (!step) return h;
  try { if (!(await apply(step, dir === "undo" ? step.before : step.after)).ok) return h; }
  catch { return h; }
  return dir === "undo" ? { past: h.past.slice(0, -1), future: [...h.future, step] }
    : { past: [...h.past, step], future: h.future.slice(0, -1) };
}
export function historyShortcut(e: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "shiftKey" | "target">): "undo" | "redo" | null {
  const target = e.target as Element | null;
  if (target?.closest?.("input, textarea, select, [contenteditable]")) return null;
  if (!e.ctrlKey && !e.metaKey) return null;
  const key = e.key.toLowerCase();
  if (key === "z") return e.shiftKey ? "redo" : "undo";
  return key === "y" && e.ctrlKey ? "redo" : null;
}
