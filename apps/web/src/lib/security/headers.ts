import { FRAME_SOURCES } from "@solar/sections/story-embed";

export function securityHeaders({ production, frameAncestors }: { production: boolean; frameAncestors?: string }): Record<string, string> {
  return {
    "Content-Security-Policy": [
      "default-src 'self'",
      // App Router emits page-specific Flight scripts; static hashes cannot cover them while preserving ISR.
      `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${production ? "" : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data:",
      `connect-src 'self'${production ? "" : " ws:"}`,
      `frame-src ${FRAME_SOURCES.join(" ")} https://challenges.cloudflare.com`,
      `frame-ancestors ${frameAncestors ?? "'none'"}`,
      "base-uri 'self'", "form-action 'self'", "object-src 'none'",
    ].join("; "),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    ...(!frameAncestors ? { "X-Frame-Options": "DENY" } : {}),
    ...(production ? { "Strict-Transport-Security": "max-age=31536000" } : {}),
  };
}
