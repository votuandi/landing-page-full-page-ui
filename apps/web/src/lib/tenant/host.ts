export function normalizeHost(raw: string | null): string | null {
  if (!raw || /[\s/\\@?#%\[\],]/u.test(raw)) return null;
  if (!/^[^:]+(?::\d{1,5})?$/u.test(raw)) return null;
  try {
    const hostname = new URL(`http://${raw}`).hostname.toLowerCase().replace(/\.$/, "");
    if (hostname.length > 253 || hostname.split(".").some((label) =>
      !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
    return hostname;
  } catch { return null; }
}
