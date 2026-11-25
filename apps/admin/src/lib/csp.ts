import { FRAME_SOURCES } from "@solar/sections/story-embed";

export function adminCsp({ nonce, previewOrigin, production }: { nonce: string; previewOrigin?: string; production: boolean }): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${production ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' https:${production ? "" : " ws:"}`,
    `frame-src ${[previewOrigin, ...FRAME_SOURCES].filter(Boolean).join(" ")}`,
    "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'",
  ].join("; ");
}
