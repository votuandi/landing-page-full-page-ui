import { z } from "zod";
import { assertCan } from "@solar/plans";
import { recordAbView } from "@solar/db";
import { entitlementResponse } from "./entitlements";
import { clientIp, getRateLimiter, type RateLimiter } from "./rateLimit";
import { loadTenantSite, type SiteEntitlements } from "./siteData";
import { getWebDb } from "./db";

const bodySchema = z.strictObject({ t: z.uuid(), v: z.enum(["A", "B"]) });
export function createAbViewHandler(deps: {
  loadSite(tenantId: string, siteId: string): Promise<{ entitlements: SiteEntitlements } | null>;
  record(tenantId: string, siteId: string, testId: string, variant: "A" | "B"): Promise<boolean>;
  limiter: RateLimiter;
}) {
  return async (request: Request) => {
    const tenantId = request.headers.get("x-tenant-id"), siteId = request.headers.get("x-site-id");
    const missing = () => Response.json({ message: "Không tìm thấy thử nghiệm" }, { status: 404 });
    if (!tenantId || !siteId) return missing();
    let raw: unknown;
    try { raw = JSON.parse(await request.text()); } catch { raw = null; }
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return Response.json({ message: "Dữ liệu không hợp lệ" }, { status: 400 });
    const rate = await deps.limiter(`rl:ab:${tenantId}:ip:${clientIp(request)}`, 30, 60_000);
    if (!rate.ok) return Response.json({ message: "Bạn gửi quá nhiều lần. Vui lòng thử lại sau." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } });
    try {
      const site = await deps.loadSite(tenantId, siteId);
      if (!site) return missing();
      try { assertCan(site.entitlements, "abTest", { disabled: site.entitlements.disabled }); }
      catch (error) { return entitlementResponse(error); }
      return await deps.record(tenantId, siteId, parsed.data.t, parsed.data.v) ? new Response(null, { status: 204 }) : missing();
    } catch (error) {
      console.error("[abTest] Không ghi được lượt xem", { tenantId, siteId }, error);
      return Response.json({ message: "Chưa thể ghi lượt xem. Vui lòng thử lại sau." }, { status: 503 });
    }
  };
}
const handler = createAbViewHandler({ loadSite: loadTenantSite,
  record: (tenantId, siteId, testId, variant) => recordAbView(getWebDb(), tenantId, siteId, testId, variant),
  limiter: (key, limit, windowMs) => getRateLimiter()(key, limit, windowMs),
});
export const abViewHandler = (request: Request) => handler(request);
