import { FRAME_SOURCES } from "@solar/sections/story-embed";

/** `frameSelf`: lab pages (dev or LAB_ENABLED) frame their own origin; public pages never do. */
export function securityHeaders({ production, frameAncestors, mediaOrigins = [], frameSelf = false }: { production: boolean; frameAncestors?: string; mediaOrigins?: string[]; frameSelf?: boolean }): Record<string, string> {
  const media = ["'self'", "blob:", "https:", ...mediaOrigins].join(" ");
  return {
    "Content-Security-Policy": [
      "default-src 'self'",
      // App Router emits page-specific Flight scripts; static hashes cannot cover them while preserving ISR.
      `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${production ? "" : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src ${media} data:`,
      `media-src ${media}`,
      "font-src 'self' data:",
      `connect-src 'self'${production ? "" : " ws:"}`,
      `frame-src ${frameSelf ? "'self' " : ""}${FRAME_SOURCES.join(" ")} https://challenges.cloudflare.com`,
      `frame-ancestors ${frameSelf ? "'self'" : frameAncestors ?? "'none'"}`,
      "base-uri 'self'", "form-action 'self'", "object-src 'none'",
    ].join("; "),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    ...(!frameAncestors && !frameSelf ? { "X-Frame-Options": "DENY" } : {}),
    ...(production ? { "Strict-Transport-Security": "max-age=31536000" } : {}),
  };
}
