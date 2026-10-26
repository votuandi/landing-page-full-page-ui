import { z } from "zod";
import { validKeyRing } from "./keyFormat.ts";

const text = z.string({ error: "bắt buộc" }).min(1, "bắt buộc");
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(value => value === "" ? undefined : value, schema.optional());
const secret = text.refine(value => new TextEncoder().encode(value).length >= 32, "cần ít nhất 32 byte");
const url = (protocols: string[]) => text.refine(value => {
  try { return protocols.includes(new URL(value).protocol); } catch { return false; }
}, "URL không hợp lệ");
const httpUrl = url(["http:", "https:"]);
const http = optional(httpUrl);
const httpList = optional(text.refine(value => value.split(",").every(part => httpUrl.safeParse(part.trim()).success), "danh sách URL HTTP(S) không hợp lệ"));
const domain = text.regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "tên miền không hợp lệ");
const database = (role: string) => url(["postgres:", "postgresql:"]).refine(value => {
  try { return decodeURIComponent(new URL(value).username) === role; } catch { return false; }
}, `phải dùng role ${role}`);
const common = {
  APP_ENCRYPTION_KEY: optional(text.refine(validKeyRing, "cần danh sách khóa base64 32 byte, không trùng")),
  REDIS_URL: optional(url(["redis:", "rediss:"])),
  MEDIA_PUBLIC_BASE: http, MEDIA_PUBLIC_BASE_LOCAL: http, MEDIA_PUBLIC_BASE_S3: http,
  MEDIA_BACKUP_DIR: optional(text),
};
const preview = { PLATFORM_DOMAIN: optional(domain), PREVIEW_SECRET: optional(secret) };
export const adminEnv = z.object({ ...common, ...preview,
  DATABASE_URL: database("app_runtime"), PLATFORM_DOMAIN: domain, ADMIN_SESSION_SECRET: secret,
});
export const webEnv = z.object({ ...common, ...preview,
  DATABASE_URL: optional(database("app_runtime")), MULTI_TENANT: optional(z.enum(["0", "1"], { error: "chỉ nhận 0 hoặc 1" })),
  NEXT_PUBLIC_SITE_URL: http, NEXT_PUBLIC_DEMO_MODE: optional(text), NEXT_PUBLIC_TEMPLATE_CTA_URL: optional(text),
  NEXT_PUBLIC_PRICING_URL: optional(text), NEXT_PUBLIC_SITE_MODE: optional(text), NEXT_PUBLIC_CATALOG_ENABLED: optional(text),
  LEAD_ADAPTERS: optional(text), LEAD_WEBHOOK_URL: http, LEAD_WEBHOOK_TOKEN: optional(text),
  GOOGLE_SHEETS_WEBAPP_URL: http, GOOGLE_SHEETS_SECRET: optional(text), TELEGRAM_BOT_TOKEN: optional(text), TELEGRAM_CHAT_ID: optional(text),
  PLATFORM_DOMAINS: optional(text), NOINDEX_DOMAINS: optional(text), REVALIDATE_SECRET: optional(text),
  WEB_REVALIDATE_URLS: httpList, TURNSTILE_SITE_KEY: optional(text), TURNSTILE_SECRET_KEY: optional(text),
}).superRefine((env, ctx) => {
  if (env.MULTI_TENANT === "1" && !env.DATABASE_URL) ctx.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "bắt buộc khi MULTI_TENANT=1" });
});
export const workerEnv = z.object({ ...common,
  PLATFORM_DATABASE_URL: database("app_platform"), REVALIDATE_SECRET: optional(text), WEB_REVALIDATE_URLS: httpList,
});
export const consoleEnv = z.object({ ...common, PLATFORM_DATABASE_URL: database("app_platform"),
  CONSOLE_SESSION_SECRET: secret, ADMIN_SESSION_SECRET: optional(secret),
}).superRefine((env, ctx) => {
  if (env.CONSOLE_SESSION_SECRET === env.ADMIN_SESSION_SECRET) ctx.addIssue({ code: "custom", path: ["CONSOLE_SESSION_SECRET"], message: "phải khác ADMIN_SESSION_SECRET" });
});

export type EnvOptions = { exit?: (code: number) => never; log?: (message: string) => void };
export function loadEnv<T extends z.ZodType>(schema: T, env: Record<string, string | undefined> = process.env,
  { exit = code => process.exit(code), log = message => console.error(message) }: EnvOptions = {}): z.output<T> {
  const parsed = schema.safeParse(Object.fromEntries(Object.entries(env).map(([key, value]) => [key, value === "" ? undefined : value])));
  if (parsed.success) return parsed.data;
  // Only fixed schema messages and allowlisted paths. Never serialize ZodError or input.
  log(`[env] Cấu hình không hợp lệ:\n${parsed.error.issues.map(issue => `- ${issue.path.join(".")}: ${issue.message}`).join("\n")}`);
  return exit(1);
}
