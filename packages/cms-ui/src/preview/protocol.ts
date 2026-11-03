export const PREVIEW_MESSAGE = "solar-preview";
export type PreviewCommand = { type: typeof PREVIEW_MESSAGE; action: "refresh" | "scroll"; sectionId?: string }
  | { type: typeof PREVIEW_MESSAGE; action: "select"; sectionId: string }
  | { type: typeof PREVIEW_MESSAGE; action: "drag" | "drop"; y: number }
  | { type: typeof PREVIEW_MESSAGE; action: "drag-cancel" };
export type PreviewEvent = { type: typeof PREVIEW_MESSAGE; action: "ready" | "updated"; sectionId?: string }
  | { type: typeof PREVIEW_MESSAGE; action: "select" | "visible"; sectionId: string }
  | { type: typeof PREVIEW_MESSAGE; action: "reorder"; sectionId: string; targetId: string; position: "before" | "after" }
  | { type: typeof PREVIEW_MESSAGE; action: "insert"; targetId?: string; position?: "before" | "after" };
const sectionIdPattern = /^[A-Za-z0-9_-]{1,64}$/;
export function parsePreviewMessage(data: unknown): PreviewCommand | PreviewEvent | null {
  if (!data || typeof data !== "object" || !("type" in data) || data.type !== PREVIEW_MESSAGE || !("action" in data)) return null;
  if (typeof data.action !== "string" || !["refresh", "scroll", "ready", "updated", "select", "visible", "reorder", "drag", "drop", "drag-cancel", "insert"].includes(data.action)) return null;
  const sectionId = "sectionId" in data ? data.sectionId : undefined;
  if ("sectionId" in data && (typeof sectionId !== "string" || !sectionIdPattern.test(sectionId))) return null;
  if (data.action === "drag" || data.action === "drop") {
    return "y" in data && typeof data.y === "number" && Number.isFinite(data.y) && data.y >= 0 && data.y <= 100000
      ? { type: PREVIEW_MESSAGE, action: data.action, y: data.y } : null;
  }
  if (data.action === "drag-cancel") return { type: PREVIEW_MESSAGE, action: "drag-cancel" };
  if (data.action === "insert") {
    if (!("targetId" in data) && !("position" in data)) return { type: PREVIEW_MESSAGE, action: "insert" };
    if (!("targetId" in data) || typeof data.targetId !== "string" || !sectionIdPattern.test(data.targetId)
      || !("position" in data) || (data.position !== "before" && data.position !== "after")) return null;
    return { type: PREVIEW_MESSAGE, action: "insert", targetId: data.targetId, position: data.position };
  }
  if (data.action === "reorder") {
    if (typeof sectionId !== "string" || !("targetId" in data) || typeof data.targetId !== "string" || !sectionIdPattern.test(data.targetId) || data.targetId === sectionId
      || !("position" in data) || (data.position !== "before" && data.position !== "after")) return null;
    return { type: PREVIEW_MESSAGE, action: "reorder", sectionId, targetId: data.targetId, position: data.position };
  }
  if (data.action === "select" || data.action === "visible") return typeof sectionId === "string" ? { type: PREVIEW_MESSAGE, action: data.action, sectionId } : null;
  if (data.action === "refresh" || data.action === "scroll" || data.action === "ready" || data.action === "updated") {
    return { type: PREVIEW_MESSAGE, action: data.action, ...(typeof sectionId === "string" ? { sectionId } : {}) };
  }
  return null;
}
export function adminOrigin(previewHost: string, protocol: string, port?: string): string | null {
  if (!["http:", "https:"].includes(protocol) || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.preview\.[a-z0-9.-]+$/i.test(previewHost)) return null;
  if (port && (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535)) return null;
  return `${protocol}//${previewHost.replace(".preview.", ".admin.")}${port ? `:${port}` : ""}`;
}
/** Check both origin and Window identity (MDN Window.postMessage security guidance). */
export function shouldHandlePreview(event: { origin: string; source: unknown }, origin: string | null, source: unknown): boolean {
  return Boolean(origin && source && event.origin === origin && event.source === source);
}
