import { randomUUID } from "node:crypto";
import { z } from "zod";

export class InvalidKeyError extends Error {
  constructor() {
    super("Khóa lưu trữ không hợp lệ.");
    this.name = "InvalidKeyError";
  }
}

export const VARIANT_WIDTHS = [640, 1280, 1920] as const;
export const VARIANT_FORMATS = ["avif", "webp"] as const;

export function variantKey(key: string, width: typeof VARIANT_WIDTHS[number], format: typeof VARIANT_FORMATS[number]): string {
  assertKey(key);
  if (!/\.[a-z0-9]+$/i.test(key) || !VARIANT_WIDTHS.includes(width) || !VARIANT_FORMATS.includes(format)) throw new InvalidKeyError();
  return key.replace(/\.[a-z0-9]+$/i, `-w${width}.${format}`);
}

export function assertKey(key: string, { prefix = false }: { prefix?: boolean } = {}): void {
  if (prefix && key === "") return;
  const value = prefix && key.endsWith("/") ? key.slice(0, -1) : key;
  if (!/^[A-Za-z0-9._/-]+$/.test(value) || value.split("/").some(part => !part || part === "." || part === "..")) {
    throw new InvalidKeyError();
  }
}

export function mediaKey(tenantId: string, ext: string, now = new Date()): string {
  const extension = ext.toLowerCase();
  if (!z.uuid().safeParse(tenantId).success || !/^[a-z0-9]{1,8}$/.test(extension) || !Number.isFinite(now.getTime())) {
    throw new InvalidKeyError();
  }
  const year = String(now.getUTCFullYear()).padStart(4, "0");
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `tenants/${tenantId}/${year}/${month}/${randomUUID()}.${extension}`;
}

export function privateKey(tenantId: string, ext: string, now = new Date()): string {
  return mediaKey(tenantId, ext, now).replace(/^tenants\//, "private/");
}
export function quarantineKey(tenantId: string): string {
  if (!z.uuid().safeParse(tenantId).success) throw new InvalidKeyError();
  return `quarantine/${tenantId}/${randomUUID()}`;
}
export function assertPublicKey(key: string): void {
  assertKey(key);
  if (!key.startsWith("tenants/") || key.split("/").length < 3) throw new InvalidKeyError();
}
