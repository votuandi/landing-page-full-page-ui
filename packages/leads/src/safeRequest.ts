import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP } from "node:net";
import type { IncomingHttpHeaders } from "node:http";
import { ChannelError } from "./errors.ts";

export type Resolver = (host: string) => Promise<{ address: string; family: number }[]>;
const resolveDns: Resolver = host => lookup(host, { all: true });
const blocked = new BlockList();
for (const [ip, prefix] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4]] as const) blocked.addSubnet(ip, prefix, "ipv4");
// Only globally routable IPv6 unicast; block special ranges inside 2000::/3 too.
const globalV6 = new BlockList(); globalV6.addSubnet("2000::", 3, "ipv6");
blocked.addSubnet("2001::", 23, "ipv6"); blocked.addSubnet("2001:db8::", 32, "ipv6"); blocked.addSubnet("2002::", 16, "ipv6"); blocked.addSubnet("3fff::", 20, "ipv6");
function publicIp(address: string) {
  const family = isIP(address);
  return family === 4 ? !blocked.check(address, "ipv4") : family === 6 && globalV6.check(address, "ipv6") && !blocked.check(address, "ipv6");
}
function parseUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new ChannelError("URL không hợp lệ", true); }
  if (url.protocol !== "https:" || url.port || url.username || url.password || url.hash) throw new ChannelError("Chỉ dùng HTTPS cổng 443, không chứa tài khoản hoặc fragment", true);
  return url;
}
async function addresses(host: string, resolve: Resolver) {
  const literal = host.replace(/^\[|\]$/g, "");
  const records = isIP(literal) ? [{ address: literal, family: isIP(literal) }]
    : await resolve(host).catch(() => { throw new ChannelError("Không phân giải được tên miền của URL"); });
  if (!records.length || records.some(row => !publicIp(row.address) || isIP(row.address) !== row.family)) throw new ChannelError("URL bị chặn: địa chỉ mạng nội bộ hoặc không công khai", true);
  return records;
}
export async function assertPublicUrl(value: string, resolve: Resolver = resolveDns) {
  const url = parseUrl(value);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([addresses(url.hostname, resolve), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new ChannelError("Hết thời gian phân giải URL")), 10_000); })]);
  } finally { clearTimeout(timer); }
}
export type SafeResponse = { status: number; body: string; headers: IncomingHttpHeaders };
export type RequestInput = { method?: string; headers?: Record<string, string>; body?: string };
export type SafeOptions = { resolve?: Resolver; request?: typeof httpsRequest; timeoutMs?: number; maxBytes?: number; allowRedirectHosts?: string[] };
export type SafeTransport = (url: string, input: RequestInput, options?: SafeOptions) => Promise<SafeResponse>;
export const safeRequest: SafeTransport = async (value, input = {}, { resolve = resolveDns, request = httpsRequest, timeoutMs = 10_000, maxBytes = 65_536, allowRedirectHosts = [] } = {}) => {
  const url = parseUrl(value);
  // Node bypasses lookup for IP literals, so validate these before creating any socket.
  if (isIP(url.hostname.replace(/^\[|\]$/g, ""))) await addresses(url.hostname, resolve);
  return new Promise<SafeResponse>((done, reject) => {
    let timer: ReturnType<typeof setTimeout>;
    const req = request(url, {
      method: input.method ?? "POST", headers: input.headers,
      // Resolve and validate in the connection's lookup; TLS still verifies the original hostname.
      lookup(host, options, callback) {
        addresses(host, resolve).then(records => options.all ? callback(null, records) : callback(null, records[0].address, records[0].family), error => callback(error, "", 4));
      },
    }, res => {
      res.once("end", () => clearTimeout(timer)); res.once("close", () => clearTimeout(timer));
      let size = 0;
      const chunks: Buffer[] = [];
      res.on("error", () => reject(new ChannelError("Không đọc được phản hồi kênh")));
      res.on("aborted", () => reject(new ChannelError("Phản hồi kênh bị ngắt")));
      res.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxBytes) { reject(new ChannelError("Phản hồi vượt giới hạn kích thước")); res.destroy(); req.destroy(); }
        else chunks.push(chunk);
      });
      res.on("end", () => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          try {
            const target = parseUrl(new URL(res.headers.location ?? "", url).href);
            if (!res.headers.location || !allowRedirectHosts.includes(target.hostname)) throw new Error();
          } catch { reject(new ChannelError("Kênh trả chuyển hướng không được phép", true)); return; }
        }
        done({ status, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") });
      });
    });
    timer = setTimeout(() => req.destroy(new ChannelError("Hết thời gian gửi kênh")), timeoutMs);
    const cleanup = () => clearTimeout(timer);
    req.on("error", error => { cleanup(); reject(error instanceof ChannelError ? error : new ChannelError("Không kết nối được kênh")); });
    req.once("close", cleanup);
    req.end(input.body);
  });
};
