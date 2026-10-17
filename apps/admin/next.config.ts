import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@solar/auth", "@solar/db", "@solar/core", "@solar/ui", "@solar/themes", "@solar/tokens", "@solar/sections", "@solar/cms-ui", "@solar/presets"],
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "ioredis"],
  poweredByHeader: false,
  agentRules: false,
  experimental: { authInterrupts: true },
  // Auth query strings contain bearer tokens, including in development.
  logging: { incomingRequests: { ignore: [/./] } },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Cache-Control", value: "private, no-store" },
      { key: "X-Robots-Tag", value: "noindex" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
      // Keep form POST Origin intact without forwarding bearer-token paths as Referer.
      { key: "Referrer-Policy", value: "strict-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ] }];
  },
};
export default config;
