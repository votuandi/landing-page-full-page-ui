import type { MediaRef } from "../fields/media";

/**
 * Ảnh tĩnh và HTTPS được render trực tiếp; UUID Media chờ resolver E8.
 */
export function mediaSrc(ref?: MediaRef): string | undefined {
  if (!ref) return undefined;
  try {
    const decoded = decodeURIComponent(ref.id);
    if (/^\/(?!\/)/.test(decoded) && !/[\\\s?#]/.test(decoded) && !decoded.includes("..")) return ref.id;
    const url = new URL(ref.id);
    if (url.protocol === "https:" && !url.username && !url.password) return ref.id;
  } catch { /* UUIDs remain placeholders until E8. */ }
  return undefined;
}
