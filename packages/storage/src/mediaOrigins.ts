/**
 * Origins that public media URLs are served from (`MEDIA_PUBLIC_BASE[_LOCAL|_S3]`, see `storageFor`). CSP `img-src`
 * and `media-src` list them so a self-hosted http media host still loads (E14-S04). No imports: the proxies use it.
 */
export function mediaOrigins(env: Record<string, string | undefined> = process.env): string[] {
  const origins = new Set<string>();
  for (const key of ["MEDIA_PUBLIC_BASE", "MEDIA_PUBLIC_BASE_LOCAL", "MEDIA_PUBLIC_BASE_S3"]) {
    try {
      const url = new URL(env[key] ?? "");
      if (url.protocol === "http:" || url.protocol === "https:") origins.add(url.origin);
    } catch { /* unset or invalid: storageFor reports it */ }
  }
  return [...origins];
}
