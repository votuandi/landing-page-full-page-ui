import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  async redirects() {
    // Đường dẫn cũ của template-8 → slug tiếng Việt của template-13
    return [
      ["/about-us", "/ve-chung-toi"], ["/contact-us", "/lien-he"],
      ["/service", "/#goi-giai-phap"], ["/service/:slug", "/#goi-giai-phap"],
      ["/project/:slug", "/cong-trinh/:slug"],
      ["/news", "/tin-tuc"], ["/news/:slug", "/tin-tuc"],
    ].map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
