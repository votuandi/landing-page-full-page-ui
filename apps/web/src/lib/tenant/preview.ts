import { normalizeHost } from "./host";

export const PREVIEW_SESSION_MS = 3_600_000;
export const previewCookieName = (production = process.env.NODE_ENV === "production") => production ? "__Host-preview" : "preview";

export function previewSlug(host: string, domain = process.env.PLATFORM_DOMAIN): string | null {
  if (!domain || normalizeHost(domain) !== domain) return null;
  const suffix = `.preview.${domain}`;
  if (!host.endsWith(suffix)) return null;
  const slug = host.slice(0, -suffix.length);
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug) ? slug : null;
}
export function safePreviewPath(path: string | null) {
  if (!path) return "/";
  try {
    const decoded = decodeURIComponent(path);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(decoded)) return "/";
  } catch { return "/"; }
  return path;
}
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
const decode = (value: string) => Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), char => char.charCodeAt(0));
async function signingKey(secret: string | undefined) {
  const bytes = new TextEncoder().encode(secret);
  if (!secret || bytes.length < 32) throw new Error("PREVIEW_SECRET must contain at least 32 bytes");
  return crypto.subtle.importKey("raw", bytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function signPreviewCookie(tenantId: string, siteId: string, secret = process.env.PREVIEW_SECRET, now = Date.now()) {
  const payload = encode(new TextEncoder().encode(JSON.stringify({ t: tenantId, s: siteId, exp: now + PREVIEW_SESSION_MS })));
  const mac = await crypto.subtle.sign("HMAC", await signingKey(secret), new TextEncoder().encode(`preview.${payload}`));
  return `${payload}.${encode(new Uint8Array(mac))}`;
}
export async function verifyPreviewCookie(value: string | undefined, tenantId: string, siteId: string, secret = process.env.PREVIEW_SECRET, now = Date.now()) {
  if (!value || value.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(value)) return false;
  try {
    const [payload, mac] = value.split(".");
    if (!await crypto.subtle.verify("HMAC", await signingKey(secret), decode(mac), new TextEncoder().encode(`preview.${payload}`))) return false;
    const data = JSON.parse(new TextDecoder().decode(decode(payload)));
    return data.t === tenantId && data.s === siteId && Number.isSafeInteger(data.exp) && data.exp > now && data.exp <= now + PREVIEW_SESSION_MS;
  } catch { return false; }
}
