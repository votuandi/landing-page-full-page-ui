import Image, { type ImageProps } from "next/image";
import { MediaImage } from "@solar/ui";

/** Ảnh sản phẩm: SVG minh họa được phục vụ nguyên bản, ảnh chụp (jpg/webp/png) qua bộ tối ưu của Next. */
export default function ProductImage(props: ImageProps & { src: string }) {
  const { src, alt, ...rest } = props;
  if (!src.startsWith("/") && !src.startsWith("https://")) return <MediaImage alt={alt} sizes={props.sizes ?? "100vw"} className={props.className} />;
  return <Image src={src} alt={alt} unoptimized={src.endsWith(".svg") || src.startsWith("https://")} {...rest} />;
}
