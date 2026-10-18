export const PREVIEW_MESSAGE = "solar-preview";
export type PreviewCommand = { type: typeof PREVIEW_MESSAGE; action: "refresh" | "scroll"; sectionId?: string };
export type PreviewEvent = { type: typeof PREVIEW_MESSAGE; action: "ready" | "updated"; sectionId?: string };
const sectionIdPattern = /^[A-Za-z0-9_-]{1,64}$/;
export function parsePreviewMessage(data: unknown): PreviewCommand | PreviewEvent | null {
  if (!data || typeof data !== "object" || !("type" in data) || data.type !== PREVIEW_MESSAGE || !("action" in data)) return null;
  if (typeof data.action !== "string" || !["refresh", "scroll", "ready", "updated"].includes(data.action)) return null;
  if ("sectionId" in data && (typeof data.sectionId !== "string" || !sectionIdPattern.test(data.sectionId))) return null;
  return { type: PREVIEW_MESSAGE, action: data.action as PreviewCommand["action"] | PreviewEvent["action"],
    ...("sectionId" in data ? { sectionId: data.sectionId as string } : {}) };
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
