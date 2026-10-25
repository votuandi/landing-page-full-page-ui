import Image, { getImageProps, type ImageProps } from "next/image";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { parseMediaUrl, type MediaFocal } from "./mediaUrl";

/** Shared by fill images and fixed-size logos; static assets retain Next's optimizer. */
export function ResponsiveImage({ focal, ...props }: ImageProps & { focal?: MediaFocal }) {
  const media = typeof props.src === "string" ? parseMediaUrl(props.src) : null;
  const position = media?.focal ?? focal;
  const style = { ...props.style, ...(position && { objectPosition: `${position.x * 100}% ${position.y * 100}%` }) };
  if (!media) return <Image {...props} alt={props.alt} style={style} unoptimized={props.unoptimized ?? (typeof props.src === "string" && /^https?:\/\//.test(props.src))} />;
  const imageProps = (format: "avif" | "webp") => {
    const { props: image } = getImageProps({ ...props, style, sizes: props.sizes ?? `${props.width}px`, fetchPriority: props.fetchPriority ?? (props.priority ? "high" : undefined), unoptimized: false, loader: ({ width }) => media.url(width, format) });
    // Descriptors must use actual widths, including images smaller than 640px.
    return { ...image, srcSet: [...new Set(media.widths)].map(width => `${media.url(width, format)} ${width}w`).join(", ") };
  };
  const avif = imageProps("avif"), webp = imageProps("webp");
  return <picture>
    <source type="image/avif" srcSet={avif.srcSet} sizes={avif.sizes ?? `${props.width}px`} />
    <img {...webp} alt={props.alt} />
  </picture>;
}

/**
 * Ảnh có fallback: `src` rỗng → khung placeholder vẽ bằng màu template (không cần file ảnh).
 * Luôn lazy-load trừ khi `priority`. Phần tử cha phải `relative` và có kích thước.
 */
export function MediaImage({ src, alt, sizes, className = "", priority = false, label, focal, style, quality }: {
  src?: string; alt: string; sizes: string; className?: string; priority?: boolean; label?: string;
  focal?: MediaFocal; style?: ImageProps["style"]; quality?: number;
}) {
  if (src) {
    return <ResponsiveImage src={src} alt={alt} fill sizes={sizes} priority={priority} loading={priority ? undefined : "lazy"} unoptimized={src.endsWith(".svg") || /^https?:\/\//.test(src)} className={`object-cover ${className}`} focal={focal} style={style} quality={quality} />;
  }
  return (
    <div role="img" aria-label={alt} className={`absolute inset-0 grid place-items-center bg-bg-tint ${className}`}>
      <div aria-hidden className="absolute inset-0 bg-media-glow" />
      <div className="relative flex flex-col items-center gap-2 p-4 text-center text-fg-muted">
        <PhotoIcon aria-hidden className="h-8 w-8 opacity-70" />
        {label && <span className="text-xs font-bold">{label}</span>}
      </div>
    </div>
  );
}

/**
 * Logo placeholder dạng chữ (wordmark) — KHÔNG dùng logo thương hiệu/báo thật.
 * Có `src` thì hiển thị ảnh logo từ config.
 */
export function Wordmark({ name, short, src, size = "md", className = "" }: {
  name: string; short?: string; src?: string; size?: "sm" | "md" | "lg"; className?: string;
}) {
  const h = size === "sm" ? "h-8" : size === "lg" ? "h-14" : "h-11";
  if (src) return <ResponsiveImage src={src} alt={name} width={160} height={56} sizes="160px" loading="lazy" className={`${h} w-auto object-contain ${className}`} />;
  const mark = (short || name.replace(/[^A-Za-zÀ-ỹ0-9 ]/g, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 3)).toUpperCase();
  return (
    <span className={`inline-flex ${h} items-center gap-2 ${className}`} aria-label={name} role="img">
      <span aria-hidden className={`grid aspect-square ${h} place-items-center rounded-xl bg-primary text-2xs font-black tracking-tight text-on-media`}>{mark}</span>
      <span aria-hidden className={`${size === "sm" ? "text-sm" : "text-base"} font-black leading-none tracking-[-.02em] text-fg`}>{name}</span>
    </span>
  );
}
