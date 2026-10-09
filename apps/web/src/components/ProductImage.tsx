import Image, { type ImageProps } from "next/image";

/** Ảnh sản phẩm: SVG minh họa được phục vụ nguyên bản, ảnh chụp (jpg/webp/png) qua bộ tối ưu của Next. */
export default function ProductImage(props: ImageProps & { src: string }) {
  const { src, alt, ...rest } = props;
  return <Image src={src} alt={alt} unoptimized={src.endsWith(".svg")} {...rest} />;
}
