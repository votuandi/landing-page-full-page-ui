import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { validKeyRing } from "./keyFormat.ts";

function keyRing(value = process.env.APP_ENCRYPTION_KEY) {
  if (!value || !validKeyRing(value)) throw new Error("APP_ENCRYPTION_KEY cần danh sách khóa base64 32 byte, không trùng");
  const keys = value.split(",").map(key => {
    const bytes = Buffer.from(key.trim(), "base64");
    return { bytes, kid: createHash("sha256").update(bytes).digest("hex").slice(0, 8) };
  });
  if (new Set(keys.map(key => key.kid)).size !== keys.length) throw new Error("APP_ENCRYPTION_KEY có mã khóa trùng");
  return keys;
}
function envelope(value: string) {
  const match = /^v1\.([a-f0-9]{8})\.([A-Za-z0-9_-]{16})\.([A-Za-z0-9_-]+)$/.exec(value);
  if (!match) throw new Error("Bí mật không hợp lệ");
  const iv = Buffer.from(match[2], "base64url"), body = Buffer.from(match[3], "base64url");
  if (body.length < 16 || body.toString("base64url") !== match[3]) throw new Error("Bí mật không hợp lệ");
  return { kid: match[1], iv, body };
}
export function encryptSecret(text: string, keys?: string): string {
  const key = keyRing(keys)[0], iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key.bytes, iv);
  const body = Buffer.concat([cipher.update(text, "utf8"), cipher.final(), cipher.getAuthTag()]);
  return `v1.${key.kid}.${iv.toString("base64url")}.${body.toString("base64url")}`;
}
export function decryptSecret(value: string, keys?: string): string {
  const ring = keyRing(keys), { kid, iv, body } = envelope(value);
  const key = ring.find(key => key.kid === kid);
  if (!key) throw new Error("Bí mật: khóa không còn trong danh sách");
  try {
    const decipher = createDecipheriv("aes-256-gcm", key.bytes, iv);
    decipher.setAuthTag(body.subarray(-16));
    return Buffer.concat([decipher.update(body.subarray(0, -16)), decipher.final()]).toString("utf8");
  } catch { throw new Error("Bí mật không hợp lệ"); }
}
export function needsRotation(value: string, keys?: string): boolean {
  const active = keyRing(keys)[0];
  decryptSecret(value, keys);
  return envelope(value).kid !== active.kid;
}
