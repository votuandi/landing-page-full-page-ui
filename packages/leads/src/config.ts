import { z } from "zod";
import { encryptSecret, decryptSecret, type SecretContext } from "@solar/env/secrets";
import { ChannelError } from "./errors.ts";

const url = z.string().max(2048).url().refine(value => {
  const parsed = new URL(value);
  return parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.port && !parsed.hash;
}, "Chỉ dùng URL HTTPS cổng 443, không chứa tài khoản hoặc fragment");
export const channelConfigSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("email"), to: z.array(z.email()).min(1).max(5) }),
  z.object({ kind: z.literal("telegram"), chatId: z.string().regex(/^-?[1-9]\d{0,19}$/, "Chat id không hợp lệ") }),
  z.object({ kind: z.literal("webhook"), url, secret: z.string().min(1).max(512) }),
  z.object({ kind: z.literal("google_sheets"), url: url.refine(value => {
    const parsed = new URL(value);
    return parsed.hostname === "script.google.com" && /^\/macros\/s\/[\w-]+\/exec$/.test(parsed.pathname) && !parsed.search;
  }, "URL phải là https://script.google.com/macros/s/…/exec"), secret: z.string().min(1).max(512) }),
]);
export type ChannelConfig = z.output<typeof channelConfigSchema>;
export type ChannelKind = ChannelConfig["kind"];
export function sealConfig(config: ChannelConfig, keys: string | undefined, context: SecretContext) {
  return encryptSecret(JSON.stringify(channelConfigSchema.parse(config)), keys, context);
}
export function openConfig(value: string, keys: string | undefined, context: SecretContext): ChannelConfig {
  let text: string;
  try { text = decryptSecret(value, keys, context); }
  catch { throw new ChannelError("Bí mật không hợp lệ", true); }
  try { return channelConfigSchema.parse(JSON.parse(text)); }
  catch { throw new ChannelError("Cấu hình kênh không hợp lệ", true); }
}
