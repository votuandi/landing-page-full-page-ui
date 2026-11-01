import { add, move, setVariant, type EditableSection } from "@solar/cms-ui/sections/ops";
import { sectionLimitIssues, sectionRegistry } from "@solar/sections";

export const BUILDER_TYPES = ["hero", "calculator", "projects", "faq", "cta-banner"] as const;
export type BuilderSnapshot = { sections: EditableSection[]; contents: Record<string, unknown> };
export type InsertPolicy = { canReorder: boolean; allowedTypes: readonly string[]; lockedTypes: readonly string[] };
export type BuilderHistory = { past: BuilderSnapshot[]; present: BuilderSnapshot; future: BuilderSnapshot[] };
export type BuilderAction =
  | { type: "undo" | "redo" }
  | { type: "insert"; sectionType: string; id: string; index: number; policy: InsertPolicy }
  | { type: "move"; from: number; to: number }
  | { type: "variant"; id: string; variant: string }
  | { type: "content"; id: string; data: unknown };

export function libraryReason(snapshot: BuilderSnapshot, type: string, policy: InsertPolicy): string | undefined {
  if (policy.lockedTypes.includes(type) || !policy.allowedTypes.includes(type)) return "Khóa theo gói — cần nâng cấp gói";
  if (!policy.canReorder) return "Gói hoặc quyền hiện tại không cho thêm section";
  return sectionLimitIssues([...snapshot.sections, { type }])[0];
}

export function insertFromLibrary(snapshot: BuilderSnapshot, type: string, id: string, index: number, policy: InsertPolicy): BuilderSnapshot {
  const def = sectionRegistry.getType(type), variant = sectionRegistry.variantsOf(type)?.[0];
  if (!BUILDER_TYPES.some(item => item === type) || !def || !variant || libraryReason(snapshot, type, policy)
    || snapshot.sections.some(s => s.id === id) || !Number.isInteger(index) || index < 0 || index > snapshot.sections.length) return snapshot;
  const appended = add(snapshot.sections, { id, type, variant, enabled: true });
  return { sections: move(appended, appended.length - 1, index), contents: { ...snapshot.contents, [id]: structuredClone(def.defaults) } };
}

export const createBuilderHistory = (present: BuilderSnapshot): BuilderHistory => ({ past: [], present, future: [] });

export function builderReducer(state: BuilderHistory, action: BuilderAction): BuilderHistory {
  if (action.type === "undo") {
    if (!state.past.length) return state;
    return { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future] };
  }
  if (action.type === "redo") {
    if (!state.future.length) return state;
    return { past: [...state.past, state.present].slice(-50), present: state.future[0], future: state.future.slice(1) };
  }
  let next = state.present;
  switch (action.type) {
    case "insert": next = insertFromLibrary(next, action.sectionType, action.id, action.index, action.policy); break;
    case "move": next = { ...next, sections: move(next.sections, action.from, action.to) }; break;
    case "variant": next = { ...next, sections: setVariant(next.sections, action.id, action.variant) }; break;
    case "content":
      if (next.sections.some(s => s.id === action.id)) next = { ...next, contents: { ...next.contents, [action.id]: action.data } };
      break;
  }
  if (JSON.stringify(next) === JSON.stringify(state.present)) return state;
  return { past: [...state.past, state.present].slice(-50), present: next, future: [] };
}

/** So với lần lưu thành công gần nhất, kể cả sau undo qua mốc lưu. */
export function editedContents(snapshot: BuilderSnapshot, saved: BuilderSnapshot): Record<string, unknown> {
  return Object.fromEntries(snapshot.sections.filter(s => Object.hasOwn(snapshot.contents, s.id)
    && JSON.stringify(snapshot.contents[s.id]) !== JSON.stringify(saved.contents[s.id]))
    .map(s => [s.id, snapshot.contents[s.id]]));
}
