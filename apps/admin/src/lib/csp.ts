import { FRAME_SOURCES } from "@solar/sections/story-embed";

export function adminCsp({ nonce, previewOrigin, production, mediaOrigins = [] }: { nonce: string; previewOrigin?: string; production: boolean; mediaOrigins?: string[] }): string {
  const media = ["'self'", "blob:", "https:", ...mediaOrigins].join(" ");
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${production ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${media} data:`,
    `media-src ${media}`,
    "font-src 'self' data:",
    `connect-src 'self' https:${production ? "" : " ws:"}`,
    `frame-src ${[previewOrigin, ...FRAME_SOURCES].filter(Boolean).join(" ")}`,
    "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'",
  ].join("; ");
}
