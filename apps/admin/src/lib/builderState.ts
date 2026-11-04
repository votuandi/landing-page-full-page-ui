import type { z } from "zod";
import { applyInlineEdit, type PreviewEvent } from "@solar/cms-ui";

export function inlineUpdate<T extends { data: unknown; readOnly?: string }>(form: T | undefined, editable: boolean,
  selectedId: string | null, event: Extract<PreviewEvent, { action: "inline" }>, schema: z.ZodType): T | null {
  if (!editable || !form || form.readOnly || event.sectionId !== selectedId) return null;
  const result = applyInlineEdit(schema, form.data, event);
  return result ? { ...form, data: result.data } : null;
}

type FlushResult = { ok: boolean; error?: string };
export async function selectBuilderSection(ids: string[], current: string | null, target: string, flush: () => Promise<FlushResult>) {
  if (!ids.includes(target) || target === current) return { selectedId: current };
  const result = await flush();
  return result.ok ? { selectedId: target } : { selectedId: current, error: result.error ?? "Chưa lưu được nội dung. Vui lòng thử lại." };
}
export function createPreviewWatch(onExpired: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => { clearTimeout(timer); timer = undefined; };
  return { request() { cancel(); timer = setTimeout(onExpired, 20000); }, updated: cancel, cancel };
}
