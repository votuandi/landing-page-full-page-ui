export function previewOrigin({ slug, platform, production, port }: { slug: string; platform: string; production: boolean; port?: string }) {
  const url = new URL(`${production ? "https" : "http"}://${slug}.preview.${platform}`);
  if (!production && port) url.port = port;
  return url.origin;
}

export function previewUrl({ slug, platform, path, token, production, port }: { slug: string; platform: string; path: string; token: string; production: boolean; port?: string }) {
  const url = new URL("/api/preview", previewOrigin({ slug, platform, production, port }));
  url.searchParams.set("token", token); url.searchParams.set("path", path);
  return url.toString();
}
