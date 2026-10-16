// @solar/core is CommonJS under tsx; use the same source import as @solar/db tests.
import { normalizeVnPhone, isVnMobile } from "../../core/src/phone.ts";

export type LoginId = { kind: "email" | "phone" | "username"; value: string };
export class InvalidLoginIdError extends Error {
  constructor() { super("Thông tin đăng nhập không đúng"); }
}

export function parseLoginId(input: string): LoginId {
  const value = input.trim().toLowerCase();
  if (value.length > 254) throw new InvalidLoginIdError();
  if (value.includes("@")) {
    if (/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value)) return { kind: "email", value };
  } else if (/^\+?[\d\s.-]+$/.test(value)) {
    const phone = normalizeVnPhone(value);
    if (isVnMobile(phone)) return { kind: "phone", value: phone };
  } else if (/^[a-z0-9_]{3,70}$/.test(value) && /[a-z]/.test(value)) {
    return { kind: "username", value };
  }
  throw new InvalidLoginIdError();
}
