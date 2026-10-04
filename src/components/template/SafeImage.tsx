"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
export default function SafeImage({ src, alt, ...props }: ImageProps) {
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(
    null,
  );
  return (
    <Image
      {...props}
      src={failedSource === src ? "/images/placeholder-product.svg" : src}
      alt={alt}
      onError={() => setFailedSource(src)}
    />
  );
}
