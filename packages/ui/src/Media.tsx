import Image from "next/image";
import { PhotoIcon } from "@heroicons/react/24/outline";

/**
 * Ảnh có fallback: `src` rỗng → khung placeholder vẽ bằng màu template (không cần file ảnh).
 * Luôn lazy-load trừ khi `priority`. Phần tử cha phải `relative` và có kích thước.
 */
export function MediaImage({ src, alt, sizes, className = "", priority = false, label }: {
  src?: string; alt: string; sizes: string; className?: string; priority?: boolean; label?: string;
}) {
  if (src) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} loading={priority ? undefined : "lazy"} unoptimized={src.endsWith(".svg")} className={`object-cover ${className}`} />;
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
  if (src) return <Image src={src} alt={name} width={160} height={56} loading="lazy" className={`${h} w-auto object-contain ${className}`} />;
  const mark = (short || name.replace(/[^A-Za-zÀ-ỹ0-9 ]/g, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 3)).toUpperCase();
  return (
    <span className={`inline-flex ${h} items-center gap-2 ${className}`} aria-label={name} role="img">
      <span aria-hidden className={`grid aspect-square ${h} place-items-center rounded-xl bg-primary text-2xs font-black tracking-tight text-on-media`}>{mark}</span>
      <span aria-hidden className={`${size === "sm" ? "text-sm" : "text-base"} font-black leading-none tracking-[-.02em] text-fg`}>{name}</span>
    </span>
  );
}
