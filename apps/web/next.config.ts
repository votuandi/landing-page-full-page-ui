import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@solar/core"],
  compress: true,
  poweredByHeader: false,
  async redirects() {
    // Đường dẫn cũ của template-8 → slug tiếng Việt
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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "phanphoisolar.com",
      },
    ],
  },
};

export default nextConfig;
