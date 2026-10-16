import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key(secret: string) {
  if (Buffer.byteLength(secret) < 32) throw new Error("ADMIN_SESSION_SECRET cần ít nhất 32 byte");
  return createHash("sha256").update(`admin-challenge:${secret}`).digest();
}
export function sealChallenge(data: Record<string, string>, tenant: string, purpose: string, secret: string, now = Date.now()) {
  const nonce = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(secret), nonce);
  cipher.setAAD(Buffer.from(`${tenant}:${purpose}`));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ data, until: now + 300_000 })), cipher.final()]);
  return Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString("base64url");
}
export function openChallenge(token: string | undefined, tenant: string, purpose: string, secret: string, now = Date.now()): Record<string, string> | null {
  if (!token || token.length > 3800 || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
  try {
    const bytes = Buffer.from(token, "base64url");
    if (bytes.toString("base64url") !== token) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(secret), bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    decipher.setAAD(Buffer.from(`${tenant}:${purpose}`));
    const value = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString());
    if (!Number.isFinite(value.until) || value.until <= now || value.until > now + 300_000 || !value.data || Object.values(value.data).some(v => typeof v !== "string")) return null;
    return value.data;
  } catch { return null; }
}
