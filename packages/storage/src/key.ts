import { randomUUID } from "node:crypto";
import { z } from "zod";

export class InvalidKeyError extends Error {
  constructor() {
    super("Khóa lưu trữ không hợp lệ.");
    this.name = "InvalidKeyError";
  }
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
