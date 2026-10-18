export function previewUrl({ slug, platform, path, token, production, port }: { slug: string; platform: string; path: string; token: string; production: boolean; port?: string }) {
  const url = new URL(`${production ? "https" : "http"}://${slug}.preview.${platform}/api/preview`);
  if (!production && port) url.port = port;
  url.searchParams.set("token", token); url.searchParams.set("path", path);
  return url.toString();
}
