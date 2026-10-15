import { NextResponse } from "next/server";
import { assertCan, ENTITLEMENTS_TAG, EntitlementError, type Feature } from "@solar/plans";
import type { SiteEntitlements } from "./siteData";

// Lead `source` → feature (table in packages/plans/README.md). Unknown sources fall back to the basic form.
const sourceFeatures: Readonly<Record<string, Feature>> = {
  contact: "leadForm", popup: "leadForm", "home-bottom": "quoteForm", calculator: "calculator", "hero-bill": "calculator",
  "story-cta": "calculator", dealer: "dealer", "quote-cart": "quoteCart",
};
export const leadSourceFeature = (source: string): Feature => sourceFeatures[source] ?? "leadForm";
const filled = (value: unknown) => value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && !value.length);
/** The client picks `source`, so the payload is checked too: items → quoteCart, estimate → calculator, dealer fields → dealer. */
export function leadFeatures(body: Record<string, unknown>): Feature[] {
  const raw = typeof body.source === "string" ? body.source.trim().slice(0, 60).replace(/[^\w-]/g, "") : "";
  const features = new Set<Feature>([leadSourceFeature(raw)]);
  if (filled(body.items)) features.add("quoteCart");
  if (filled(body.estimate)) features.add("calculator");
  if (filled(body.businessType)) features.add("dealer");
  return [...features];
}

/** Cache tags every tenant page carries besides `tenant:<id>`; attached once E5-S06 enables `cacheTag`. */
export const PAGE_TAGS = Object.freeze([ENTITLEMENTS_TAG]);

/** 403/413 JSON for API routes; other errors are rethrown for the caller's generic handling. */
export function entitlementResponse(error: unknown) {
  if (!(error instanceof EntitlementError)) throw error;
  return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
}

type LoadSite = (tenantId: string, siteId: string) => Promise<{ entitlements: SiteEntitlements } | null>;
/** Tenant `POST /api/lead`: 403 when the source's feature is off. Storing tenant leads is E11, so allowed leads still get 503. */
export function createTenantLeadGate(loadSite: LoadSite) {
  return async (request: Request) => {
    let body: unknown;
    try { body = await request.json(); } catch { body = null; }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ ok: false, message: "Dữ liệu không hợp lệ" }, { status: 400 });
    const site = await loadSite(request.headers.get("x-tenant-id") ?? "", request.headers.get("x-site-id") ?? "");
    if (!site) return NextResponse.json({ ok: false, message: "Không tìm thấy website" }, { status: 404 });
    try {
      for (const feature of leadFeatures(body as Record<string, unknown>)) assertCan(site.entitlements, feature, { disabled: site.entitlements.disabled });
    } catch (error) { return entitlementResponse(error); }
    return NextResponse.json({ ok: false, message: "Chưa thể gửi thông tin. Vui lòng liên hệ hotline của công ty." }, { status: 503 });
  };
}
