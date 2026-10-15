import { NextResponse } from "next/server";
import { assertCan } from "@solar/plans";
import { createLead, type LeadInput } from "@solar/db";
import { parseLead, str } from "@/lib/leads/parse";
import type { Lead } from "@/lib/leads/types";
import { entitlementResponse, leadFeatures } from "./entitlements";
import { clientIp, getRateLimiter, type RateLimiter } from "./rateLimit";
import { loadTenantSite, type SiteEntitlements } from "./siteData";
import { getWebDb } from "./db";

/** Below this the form was filled by a script; forms send `elapsedMs` since mount. */
export const MIN_FILL_MS = 3_000;
export const LEAD_LIMITS = { ip: { limit: 10, windowMs: 60_000 }, phone: { limit: 5, windowMs: 10 * 60_000 } } as const;

type Deps = {
  loadSite: (tenantId: string, siteId: string) => Promise<{ entitlements: SiteEntitlements } | null>;
  saveLead: (tenantId: string, siteId: string, lead: LeadInput) => Promise<{ id: string }>;
  limiter: RateLimiter;
  verifyTurnstile?: (token: string, ip: string) => Promise<boolean>;
};
const json = (body: object, status = 200, headers?: HeadersInit) => NextResponse.json(body, { status, headers });
// Bots get a normal success so they do not adapt; nothing is stored.
const ignored = () => json({ ok: true });
const tooMany = (retryAfterSec: number) =>
  json({ ok: false, message: "Bạn gửi quá nhiều lần. Vui lòng thử lại sau ít phút hoặc gọi hotline." }, 429, { "Retry-After": String(retryAfterSec) });

function unavailable(error: unknown, tenantId: string, siteId: string) {
  console.error("[lead] lỗi hạ tầng khi nhận lead", { tenantId, siteId }, error);
  return json({ ok: false, message: "Chưa thể gửi thông tin. Vui lòng thử lại hoặc gọi hotline của công ty." }, 503);
}

// JSON round trip drops undefined fields.
export const toLeadInput = ({ name, phone, email, message, source, segment, ...data }: Lead): LeadInput =>
  ({ name, phone, email, message, source, segment, data: JSON.parse(JSON.stringify(data)) });

/** Cloudflare Turnstile, only when `TURNSTILE_SECRET_KEY` is set. */
export async function verifyTurnstile(token: string, ip: string, secret = process.env.TURNSTILE_SECRET_KEY, timeoutMs = 5_000) {
  if (!secret) return true;
  if (!token) return false;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body: new URLSearchParams({ secret, response: token, remoteip: ip }), signal: AbortSignal.timeout(timeoutMs),
    });
    return (await response.json() as { success?: unknown }).success === true;
  } catch { return false; }
}

/**
 * Tenant `POST /api/lead` (E11-S01). Tenant and site come from the proxy headers (resolved from the host), never the body.
 * The lead and its delivery jobs are committed before the 200, so a crash right after responding loses nothing (D14).
 */
export function createTenantLeadHandler({ loadSite, saveLead, limiter, verifyTurnstile: verify = verifyTurnstile }: Deps) {
  return async (request: Request) => {
    let body: unknown;
    try { body = await request.json(); } catch { body = null; }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ ok: false, message: "Dữ liệu không hợp lệ" }, 400);
    const fields = body as Record<string, unknown>;
    if (str(fields.website)) return ignored();
    const elapsed = Number(fields.elapsedMs);
    if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return ignored();

    const tenantId = request.headers.get("x-tenant-id") ?? "", siteId = request.headers.get("x-site-id") ?? "";
    const ip = clientIp(request);
    const byIp = await limiter(`rl:lead:${tenantId}:ip:${ip}`, LEAD_LIMITS.ip.limit, LEAD_LIMITS.ip.windowMs);
    if (!byIp.ok) return tooMany(byIp.retryAfterSec);

    let site: Awaited<ReturnType<Deps["loadSite"]>>;
    try { site = await loadSite(tenantId, siteId); } catch (error) { return unavailable(error, tenantId, siteId); }
    if (!site) return json({ ok: false, message: "Không tìm thấy website" }, 404);
    try {
      for (const feature of leadFeatures(fields)) assertCan(site.entitlements, feature, { disabled: site.entitlements.disabled });
    } catch (error) { return entitlementResponse(error); }

    const parsed = parseLead(fields);
    if ("error" in parsed) return json({ ok: false, message: parsed.error }, 400);
    const byPhone = await limiter(`rl:lead:${tenantId}:phone:${parsed.lead.phone}`, LEAD_LIMITS.phone.limit, LEAD_LIMITS.phone.windowMs);
    if (!byPhone.ok) return tooMany(byPhone.retryAfterSec);
    if (!await verify(str(fields.turnstileToken ?? fields["cf-turnstile-response"], 4096), ip)) {
      return json({ ok: false, message: "Không xác minh được bạn không phải robot. Vui lòng tải lại trang và thử lại." }, 400);
    }

    try {
      const { id } = await saveLead(tenantId, siteId, toLeadInput(parsed.lead));
      return json({ ok: true, id });
    } catch (error) { return unavailable(error, tenantId, siteId); }
  };
}

let handler: ReturnType<typeof createTenantLeadHandler> | undefined;
// Lazy so single-site mode never opens Prisma or Redis.
export const tenantLeadHandler = (request: Request) => (handler ??= createTenantLeadHandler({
  loadSite: loadTenantSite,
  saveLead: (tenantId, siteId, lead) => createLead(getWebDb(), tenantId, siteId, lead),
  limiter: getRateLimiter(),
}))(request);
