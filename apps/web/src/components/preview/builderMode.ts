import type { InlineField } from "@solar/cms-ui/preview/protocol";
import { pickLocale } from "@solar/sections";

export function matchInline(texts: string[], fields: InlineField[], locale: "vi" | "en"): Map<number, InlineField> {
  const counts = new Map<string, number>(), byText = new Map<string, InlineField[]>();
  for (const text of texts) counts.set(text.trim(), (counts.get(text.trim()) ?? 0) + 1);
  for (const field of fields) {
    const text = pickLocale(field.text, locale).trim();
    if (text) byText.set(text, [...(byText.get(text) ?? []), field]);
  }
  const matches = new Map<number, InlineField>();
  texts.forEach((text, index) => {
    const key = text.trim(), fields = byText.get(key);
    if (counts.get(key) === 1 && fields?.length === 1) matches.set(index, fields[0]);
  });
  return matches;
}

export function insertPlain(value: string, start: number, end: number, pasted: string): { value: string; caret: number } {
  const before = (value.slice(0, start) + pasted).replace(/\s+/g, " ");
  return { value: (value.slice(0, start) + pasted + value.slice(end)).replace(/\s+/g, " "), caret: before.length };
}

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
