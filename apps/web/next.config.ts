import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@solar/cache", "@solar/core", "@solar/ui", "@solar/themes", "@solar/tokens", "@solar/sections", "@solar/presets", "@solar/db", "@solar/plans"],
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "ioredis"],
  // E5-S06: data and UI caches are tagged per tenant (`tenantPageTags`); `/api/revalidate` expires them by tag.
  cacheComponents: true,
  experimental: { globalNotFound: true },
  compress: true,
  poweredByHeader: false,
  // Single-use preview tokens must not appear in next dev request logs.
  logging: { incomingRequests: { ignore: [/^\/api\/preview(?:\?|$)/] } },
  // Next 16.3.8 leaves stale canonical tags after streamed tenant metadata on client navigation.
  htmlLimitedBots: /.*/,
  // Không để `next dev` sinh AGENTS.md/CLAUDE.md trong apps/web — quy ước agent nằm ở AGENTS.md gốc
  agentRules: false,
  async headers() {
    return [{
      source: "/fonts/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }];
  },
  async redirects() {
    // Đường dẫn cũ của template-8 → slug tiếng Việt. Chế độ multi-tenant: mỗi tenant tự cấu hình ở Site.seo.redirects.
    if (process.env.MULTI_TENANT === "1") return [];
    return [
      ["/about-us", "/ve-chung-toi"], ["/contact-us", "/lien-he"],
      ["/service", "/giai-phap"], ["/service/:slug", "/giai-phap/:slug"],
      ["/project/:slug", "/cong-trinh/:slug"],
      ["/product", "/san-pham"], ["/product/:slug", "/san-pham/:slug"],
      ["/news", "/tin-tuc"], ["/news/:slug", "/tin-tuc/:slug"],
    ].map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Next 16 chỉ cho phép quality 75 mặc định; Hero dùng quality={70}
    qualities: [70, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "phanphoisolar.com",
      },
    ],
  },
};

export default nextConfig;
