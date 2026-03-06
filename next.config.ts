import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    domains: ["phanphoisolar.com"],
  },
  output: "standalone",
};

export default nextConfig;
