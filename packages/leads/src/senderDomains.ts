import { domainToASCII } from "node:url";
import { isIP } from "node:net";
import { z } from "zod";
import { ChannelError, checkStatus } from "./errors.ts";

export function normalizeSenderHostname(input: string, reserved: readonly string[]) {
  const value = input.trim().replace(/\.$/, "");
  const hostname = domainToASCII(value).toLowerCase();
  if (!hostname || hostname.length > 253 || /[\s\x00-\x20\x7f/:@?#\\]/.test(value) || isIP(hostname)
    || /^[\d.]+$/.test(hostname) || hostname.split(".").length < 2
    || !hostname.split(".").every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    throw new ChannelError("Tên miền không hợp lệ. Vui lòng nhập tên miền, ví dụ mail.congty.vn.", true);
  }
  if (reserved.some(name => { const domain = domainToASCII(name.replace(/\.$/, "")).toLowerCase(); return domain && (hostname === domain || hostname.endsWith(`.${domain}`)); })) {
    throw new ChannelError("Không thể dùng tên miền của nền tảng để gửi thông báo.", true);
  }
  return hostname;
}

export function senderFrom(name: string, hostname: string) {
  const clean = [...name.replace(/["\\<>\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, "").trim()].slice(0, 78).join("");
  const address = `no-reply@${normalizeSenderHostname(hostname, [])}`;
  return clean ? `"${clean}" <${address}>` : address;
}

export function mapResendStatus(status: unknown): "pending" | "verified" | "failed" {
  return status === "verified" ? "verified" : status === "failed" ? "failed" : "pending";
}
export const senderDnsRecordsSchema = z.array(z.object({
  record: z.string().max(100).optional(), name: z.string().min(1).max(253), type: z.string().min(1).max(20),
  value: z.string().min(1).max(20_000), priority: z.number().int().min(0).max(65535).optional(),
  ttl: z.string().max(100).optional(), status: z.string().max(100).optional(),
})).max(64);
export type SenderDnsRecord = z.output<typeof senderDnsRecordsSchema>[number];
const domainSchema = z.object({ id: z.uuid(), name: z.string().min(1).max(253), status: z.string(), records: senderDnsRecordsSchema });
export type ResendDomain = z.output<typeof domainSchema>;
export type SenderDomainEnv = { RESEND_DOMAINS_API_KEY?: string };
export type EmailSender = { hostname: string; from: string; onRejected?: () => Promise<void> };

async function request(path: string, method: string, env: SenderDomainEnv, fetcher: typeof fetch, body?: object) {
  if (!env.RESEND_DOMAINS_API_KEY) throw new ChannelError("Nền tảng chưa cấu hình khóa quản lý tên miền gửi email.");
  try {
    const response = await fetcher(`https://api.resend.com/domains${path}`, {
      method, headers: { Authorization: `Bearer ${env.RESEND_DOMAINS_API_KEY}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10_000), redirect: "error",
    });
    if (method === "DELETE" && response.status === 404) { await response.body?.cancel(); return; }
    if (!response.ok) { await response.body?.cancel(); checkStatus(response.status, "Tên miền gửi"); }
    if (method === "DELETE" || path.endsWith("/verify")) { await response.body?.cancel(); return; }
    return domainSchema.parse(await response.json());
  } catch {
    // Never expose provider bodies, auth headers or network URLs in an admin action result.
    throw new ChannelError("Không thể kết nối dịch vụ tên miền gửi. Vui lòng thử lại.");
  }
}
const domainPath = (id: string) => `/${z.uuid().parse(id)}`;
// No tracking_subdomain is set, and Resend only applies open/click tracking when one is verified.
export async function createResendDomain(hostname: string, env: SenderDomainEnv, fetcher = fetch): Promise<ResendDomain> {
  return (await request("", "POST", env, fetcher, { name: hostname }))!;
}
export async function getResendDomain(id: string, env: SenderDomainEnv, fetcher = fetch): Promise<ResendDomain> {
  return (await request(domainPath(id), "GET", env, fetcher))!;
}
export async function verifyResendDomain(id: string, env: SenderDomainEnv, fetcher = fetch) {
  await request(`${domainPath(id)}/verify`, "POST", env, fetcher);
}
export async function deleteResendDomain(id: string, env: SenderDomainEnv, fetcher = fetch) {
  await request(domainPath(id), "DELETE", env, fetcher);
}
