export function builderMode(search: string, framed: boolean): null | { reorder: boolean } {
  const params = new URLSearchParams(search);
  return framed && params.get("builder") === "1" ? { reorder: params.get("reorder") !== "0" } : null;
}
export type SectionRect = { id: string; top: number; bottom: number; height: number };
export function dropPosition(y: number, rect: SectionRect): "before" | "after" | null {
  return rect.height > 0 ? y < rect.top + rect.height / 2 ? "before" : "after" : null;
}
export function dropTarget(rects: SectionRect[], y: number, excludeId?: string): { targetId: string; position: "before" | "after"; top: number } | null {
  const available = rects.filter(rect => rect.height > 0 && rect.id !== excludeId);
  const target = available.find(rect => y < rect.bottom) ?? available.at(-1);
  const position = target && dropPosition(y, target);
  return target && position ? { targetId: target.id, position, top: position === "before" ? target.top : target.bottom } : null;
}
export function currentSection(rects: SectionRect[], viewport: number): string | null {
  const visible = rects.filter(rect => rect.height > 0 && rect.bottom > 0 && rect.top < viewport);
  const line = Math.min(160, viewport / 3);
  return (visible.find(rect => rect.top <= line && rect.bottom > line) ?? visible[0])?.id ?? null;
}
export const scrollBehavior = (reduced: boolean): ScrollBehavior => reduced ? "auto" : "smooth";
