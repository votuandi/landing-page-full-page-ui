import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { COMMON_PASSWORDS } from "./commonPasswords.ts";

const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const derive = promisify((password: string, salt: Buffer, callback: (error: Error | null, key: Buffer) => void) => scrypt(password, salt, 32, options, callback));

export async function hashPassword(password: string): Promise<string> {
  if (password.length > 128) throw new Error("Mật khẩu tối đa 128 ký tự");
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$32768$8$1$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (password.length > 128 || stored.length > 256) return false;
  const parts = stored.split("$");
  // Bound the cost before invoking scrypt, even for a corrupt database hash.
  if (parts.length !== 6 || parts[0] !== "scrypt" || parts[1] !== "32768" || parts[2] !== "8" || parts[3] !== "1"
    || !/^[A-Za-z0-9_-]{16,86}$/.test(parts[4]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[5])) return false;
  try {
    const expected = Buffer.from(parts[5], "base64url");
    const actual = await derive(password, Buffer.from(parts[4], "base64url"));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch { return false; }
}

export async function dummyVerify(): Promise<void> {
  await derive("missing-account", Buffer.alloc(16));
}

export function checkPasswordPolicy(password: string, { identifiers = [] }: { identifiers?: readonly string[] } = {}): { ok: true } | { ok: false; reason: string } {
  if (password.length < 10) return { ok: false, reason: "Mật khẩu cần ít nhất 10 ký tự" };
  if (password.length > 128) return { ok: false, reason: "Mật khẩu tối đa 128 ký tự" };
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return { ok: false, reason: "Mật khẩu quá phổ biến, hãy chọn mật khẩu khác" };
  if (identifiers.some(id => id.trim().toLowerCase() === password.toLowerCase())) return { ok: false, reason: "Mật khẩu không được trùng thông tin đăng nhập" };
  return { ok: true };
}
