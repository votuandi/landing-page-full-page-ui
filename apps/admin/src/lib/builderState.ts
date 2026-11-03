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
