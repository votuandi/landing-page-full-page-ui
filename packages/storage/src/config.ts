import { z } from "zod";
import { createLocalDriver } from "./drivers/local.ts";
import { createS3Driver } from "./drivers/s3.ts";
import type { StorageDriver } from "./types.ts";

const httpUrl = z.url({ protocol: /^https?$/ });
export type StorageKind = "local" | "s3";
export function defaultDriver(env: Record<string, string | undefined> = process.env): StorageKind {
  const parsed = z.enum(["local", "s3"]).default("local").safeParse(env.STORAGE_DRIVER);
  if (!parsed.success) throw new Error("Cấu hình lưu trữ không hợp lệ: STORAGE_DRIVER");
  return parsed.data;
}
const schema = z.object({
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  MEDIA_PUBLIC_BASE: httpUrl,
  STORAGE_LOCAL_ROOT: z.string().min(1).optional(),
  S3_BUCKET: z.string().min(1).optional(),
  S3_REGION: z.string().min(1).default("auto"),
  S3_ENDPOINT: httpUrl.optional(),
  S3_FORCE_PATH_STYLE: z.enum(["true", "false"]).optional(),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
})
  // Run independent requirements even when another variable is missing or invalid.
  .refine(env => env.STORAGE_DRIVER !== "local" || !!env.STORAGE_LOCAL_ROOT,
    { path: ["STORAGE_LOCAL_ROOT"], message: "Thiếu biến môi trường.", when: () => true })
  .refine(env => env.STORAGE_DRIVER !== "s3" || !!env.S3_BUCKET,
    { path: ["S3_BUCKET"], message: "Thiếu biến môi trường.", when: () => true })
  .refine(env => env.STORAGE_DRIVER !== "s3" || !env.S3_SECRET_ACCESS_KEY || !!env.S3_ACCESS_KEY_ID,
    { path: ["S3_ACCESS_KEY_ID"], message: "Thiếu biến môi trường.", when: () => true })
  .refine(env => env.STORAGE_DRIVER !== "s3" || !env.S3_ACCESS_KEY_ID || !!env.S3_SECRET_ACCESS_KEY,
    { path: ["S3_SECRET_ACCESS_KEY"], message: "Thiếu biến môi trường.", when: () => true });

export function storageFromEnv(env: Record<string, string | undefined> = process.env): StorageDriver {
  return storageFor(defaultDriver(env), env);
}

export function storageFor(kind: StorageKind, env: Record<string, string | undefined> = process.env): StorageDriver {
  const selected = kind === "local"
    ? { STORAGE_LOCAL_ROOT: env.STORAGE_LOCAL_ROOT }
    : Object.fromEntries(Object.entries(env).filter(([key]) => key.startsWith("S3_")));
  const result = schema.safeParse({ ...selected, STORAGE_DRIVER: kind, MEDIA_PUBLIC_BASE: env[`MEDIA_PUBLIC_BASE_${kind.toUpperCase()}`] || env.MEDIA_PUBLIC_BASE });
  if (!result.success) {
    // Never include Zod's input values or credential-bearing URLs in configuration errors.
    throw new Error(`Cấu hình lưu trữ không hợp lệ: ${[...new Set(result.error.issues.map(issue => issue.path[0]))].join(", ")}`);
  }
  const value = result.data;
  if (value.STORAGE_DRIVER === "local") return createLocalDriver({ root: value.STORAGE_LOCAL_ROOT!, publicBase: value.MEDIA_PUBLIC_BASE });
  return createS3Driver({
    bucket: value.S3_BUCKET!, region: value.S3_REGION, endpoint: value.S3_ENDPOINT,
    forcePathStyle: value.S3_FORCE_PATH_STYLE === "true", publicBase: value.MEDIA_PUBLIC_BASE,
    credentials: value.S3_ACCESS_KEY_ID ? { accessKeyId: value.S3_ACCESS_KEY_ID, secretAccessKey: value.S3_SECRET_ACCESS_KEY! } : undefined,
  });
}
