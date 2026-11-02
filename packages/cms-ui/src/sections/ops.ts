export type EditableSection = { id: string; type: string; variant: string; enabled: boolean; anchor?: string };

export function move(value: readonly EditableSection[], from: number, to: number): EditableSection[] {
  const next = [...value];
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= next.length || to >= next.length) return next;
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}
export function moveRelative(value: EditableSection[], id: string, targetId: string, position: "before" | "after"): EditableSection[] {
  if (id === targetId || !value.some(s => s.id === id) || !value.some(s => s.id === targetId)) return value;
  const next = value.filter(s => s.id !== id);
  next.splice(next.findIndex(s => s.id === targetId) + (position === "after" ? 1 : 0), 0, value.find(s => s.id === id)!);
  return next.every((s, i) => s === value[i]) ? value : next;
}
export const toggle = (value: readonly EditableSection[], id: string) => value.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
export const setVariant = (value: readonly EditableSection[], id: string, variant: string) => value.map(s => s.id === id ? { ...s, variant } : s);
export const add = (value: readonly EditableSection[], section: EditableSection) => value.some(s => s.id === section.id) ? [...value] : [...value, section];
export const remove = (value: readonly EditableSection[], id: string) => value.filter(s => s.id !== id);
