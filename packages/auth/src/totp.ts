import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32Encode(bytes: Uint8Array): string {
  let bits = 0, value = 0, result = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { bits -= 5; result += alphabet[(value >>> bits) & 31]; }
  }
  if (bits) result += alphabet[(value << (5 - bits)) & 31];
  return result;
}
export function base32Decode(input: string): Buffer {
  const text = input.toUpperCase().replace(/=+$/, "");
  if (!/^[A-Z2-7]+$/.test(text)) throw new Error("Invalid base32 secret");
  let bits = 0, value = 0;
  const bytes: number[] = [];
  for (const char of text) {
    value = (value << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) { bits -= 8; bytes.push((value >>> bits) & 255); }
  }
  if ((value & ((1 << bits) - 1)) !== 0) throw new Error("Invalid base32 padding");
  return Buffer.from(bytes);
}
export function generateTotpSecret(): string { return base32Encode(randomBytes(20)); }

/** time is Unix milliseconds; step is seconds, as in RFC 6238. */
export function totp(secret: string, time = Date.now(), { step = 30, digits = 6, algorithm = "sha1" }: { step?: number; digits?: 6 | 8; algorithm?: "sha1" } = {}): string {
  if (!Number.isFinite(time) || time < 0 || !Number.isInteger(step) || step <= 0 || ![6, 8].includes(digits) || algorithm !== "sha1") throw new Error("Invalid TOTP options");
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(time / 1000 / step)));
  const digest = createHmac(algorithm, base32Decode(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits).toString().padStart(digits, "0");
}
export function verifyTotp(secret: string, code: string, now = Date.now(), window = 1): boolean {
  return matchingTotpStep(secret, code, now, window) !== null;
}
/** Returns the newest matching step so callers can atomically reject replay. */
export function matchingTotpStep(secret: string, code: string, now = Date.now(), window = 1): number | null {
  if (!/^\d{6}$/.test(code) || !Number.isInteger(window) || window < 0 || window > 10) return null;
  try {
    let matched: number | null = null;
    for (let i = -window; i <= window; i++) {
      if (now + i * 30_000 < 0) continue;
      if (timingSafeEqual(Buffer.from(totp(secret, now + i * 30_000)), Buffer.from(code))) matched = Math.floor(now / 30_000) + i;
    }
    return matched;
  } catch { return null; }
}
export function otpauthUri({ issuer, account, secret }: { issuer: string; account: string; secret: string }): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?${new URLSearchParams({ secret, issuer, algorithm: "SHA1", digits: "6", period: "30" })}`;
}
export function generateBackupCodes(n = 10): { codes: string[]; hashes: string[] } {
  if (!Number.isInteger(n) || n < 1 || n > 100) throw new Error("Invalid backup code count");
  const codes = Array.from({ length: n }, () => {
    const code = base32Encode(randomBytes(5)).toLowerCase();
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  });
  return { codes, hashes: codes.map(backupHash) };
}
function backupHash(code: string): string { return createHash("sha256").update(code.toLowerCase().replace(/-/g, "")).digest("hex"); }
export function consumeBackupCode(hashes: readonly string[], code: string): string[] | null {
  if (!/^[a-z2-7]{4}-?[a-z2-7]{4}$/i.test(code)) return null;
  const expected = Buffer.from(backupHash(code), "hex");
  const index = hashes.findIndex(hash => /^[a-f0-9]{64}$/.test(hash) && timingSafeEqual(Buffer.from(hash, "hex"), expected));
  return index < 0 ? null : hashes.filter((_, i) => i !== index);
}
