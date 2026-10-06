import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: { formats: ["image/webp"] },
  async redirects() {
    return [
      {
        source: "/service/solar-nha-xuong",
        destination: "/giai-phap/nha-may",
        permanent: true,
      },
      {
        source: "/service/solar-gia-dinh",
        destination: "/giai-phap/ho-gia-dinh",
        permanent: true,
      },
      {
        source: "/service/hybrid-luu-tru",
        destination: "/giai-phap/ho-gia-dinh",
        permanent: true,
      },
      {
        source: "/service/om-ve-sinh",
        destination: "/service",
        permanent: true,
      },
      ...Object.entries({
        "jinko-tiger-neo-585w": "tam-pin-585w",
        "longi-hi-mo-7-580w": "tam-pin-580w",
        "trina-vertex-n-595w": "tam-pin-585w",
        "sungrow-sg125cx": "bien-tan-125kw",
        "huawei-sun2000-100ktl": "bien-tan-125kw",
        "goodwe-gw50kn-mt": "bien-tan-50kw",
        "byd-battery-box-hvm": "pin-luu-tru-14kwh",
        "pylontech-force-h2": "pin-luu-tru-14kwh",
        "goodwe-et-plus-10kw": "bien-tan-hybrid-10kw",
        "mc4-dc-kit": "bo-dau-noi-dc",
      }).map(([slug, target]) => ({
        source: `/product/${slug}`,
        destination: `/product/${target}`,
        permanent: true,
      })),
      {
        source: "/project/nha-may-thuc-pham-long-an",
        destination: "/project/phan-bon-dong-xanh",
        permanent: true,
      },
      {
        source: "/project/kho-lanh-binh-duong",
        destination: "/project/phan-bon-dong-xanh",
        permanent: true,
      },
      {
        source: "/project/trang-trai-dong-nai",
        destination: "/project/trang-trai-phu-an",
        permanent: true,
      },
    ];
  },
};
export default nextConfig;
