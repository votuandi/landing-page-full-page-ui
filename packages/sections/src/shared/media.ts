import type { MediaRef } from "../fields/media";

/**
 * Tạm tới E5: `id` bắt đầu bằng "/" là ảnh tĩnh trong `public/` của app; id bản ghi Media chưa resolve được → `undefined`
 * để variant vẽ placeholder (`MediaImage`). E5 thay bằng resolver media theo tenant.
 */
export function mediaSrc(ref?: MediaRef): string | undefined {
  return ref && ref.id.startsWith("/") && !ref.id.startsWith("//") ? ref.id : undefined;
}
