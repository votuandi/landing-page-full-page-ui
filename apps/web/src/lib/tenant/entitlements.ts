import { NextResponse } from "next/server";
import { assertCan, ENTITLEMENTS_TAG, EntitlementError, type Feature } from "@solar/plans";

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
