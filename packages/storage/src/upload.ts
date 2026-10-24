export type MediaKind = "image" | "video" | "pdf";
export const UPLOAD_LIMITS = { image: 15 * 1024 ** 2, video: 200 * 1024 ** 2, pdf: 20 * 1024 ** 2 } as const;
const formats: Record<string, { ext: string; kind: MediaKind }> = {
  "image/jpeg": { ext: "jpg", kind: "image" }, "image/png": { ext: "png", kind: "image" },
  "image/webp": { ext: "webp", kind: "image" }, "image/gif": { ext: "gif", kind: "image" },
  "image/avif": { ext: "avif", kind: "image" }, "video/mp4": { ext: "mp4", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" }, "video/webm": { ext: "webm", kind: "video" },
  "application/pdf": { ext: "pdf", kind: "pdf" },
};
export const kindOf = (mime: string): MediaKind | null => formats[mime]?.kind ?? null;
export function sniff(bytes: Uint8Array): { mime: string; ext: string; kind: MediaKind } | null {
  const b = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const starts = (hex: string) => b.subarray(0, hex.length / 2).equals(Buffer.from(hex, "hex"));
  let mime: string | undefined;
  if (starts("ffd8ff")) mime = "image/jpeg";
  else if (starts("89504e470d0a1a0a")) mime = "image/png";
  else if (["GIF87a", "GIF89a"].includes(b.toString("ascii", 0, 6))) mime = "image/gif";
  else if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") mime = "image/webp";
  else if (b.length >= 12 && b.toString("ascii", 4, 8) === "ftyp") {
    const brand = b.toString("ascii", 8, 12);
    if (["avif", "avis"].includes(brand)) mime = "image/avif";
    else if (brand === "qt  ") mime = "video/quicktime";
    else if (["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "dash"].includes(brand)) mime = "video/mp4";
  } else if (starts("1a45dfa3")) mime = "video/webm";
  else if (b.toString("ascii", 0, 5) === "%PDF-") mime = "application/pdf";
  return mime ? { mime, ...formats[mime] } : null;
}
