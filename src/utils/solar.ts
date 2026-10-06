import type { Metadata } from "next";
import { SITE_CONFIG, IMAGES } from "@/content/site";
export function makeMetadata(
  title: string,
  description: string,
  path = "/",
  image: string = IMAGES.factory.src,
): Metadata {
  const url = new URL(path, SITE_CONFIG.url).toString();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_CONFIG.brand.name,
      locale: "vi_VN",
      type: "website",
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
