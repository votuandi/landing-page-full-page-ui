import { z } from "zod";
import { featureDependencies, featureLabels, getPlan, isFeature, limitLabels, plans, type Feature, type LimitKey } from "./plans";

export const TRIAL_DAYS = 14;
export const ENTITLEMENTS_TAG = "platform:entitlements";
export const DISABLED_FEATURES_KEY = "features.disabled";

const until = z.iso.datetime({ offset: true }).optional();
const reason = z.string().trim().min(1).max(500);
export const featureOverrideSchema = z.object({ on: z.boolean(), until, reason });
export const limitOverrideSchema = z.object({ add: z.number().int().min(0), until, reason });
export const featureOverridesSchema = z.partialRecord(z.enum(Object.keys(featureLabels) as [Feature, ...Feature[]]), featureOverrideSchema);
export const limitOverridesSchema = z.partialRecord(z.enum(Object.keys(limitLabels) as [LimitKey, ...LimitKey[]]), limitOverrideSchema);
export const disabledFeaturesSchema = z.array(z.string()).transform(values => values.filter(isFeature));
export type FeatureOverrides = z.infer<typeof featureOverridesSchema>;
export type LimitOverrides = z.infer<typeof limitOverridesSchema>;

/** Tenant fields entitlement resolution needs (D19). Overrides come straight from JSON columns. */
export type EntitlementSubject = Readonly<{
  planId: string; addons: readonly string[]; status: string; createdAt: Date;
  featureOverrides?: unknown; limitOverrides?: unknown;
}>;
export type EntitlementContext = Readonly<{ disabled?: readonly string[]; now?: Date }>;

// Invalid entries are skipped one by one: bad JSON never unlocks anything and never hides valid overrides.
function override<T>(raw: unknown, key: string, schema: z.ZodType<T & { until?: string }>, now: Date): T | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const parsed = schema.safeParse((raw as Record<string, unknown>)[key]);
  if (!parsed.success || (parsed.data.until && Date.parse(parsed.data.until) <= now.getTime())) return undefined;
  return parsed.data;
}
const inTrial = (site: EntitlementSubject, now: Date) =>
  site.status === "trial" && now.getTime() < site.createdAt.getTime() + TRIAL_DAYS * 86_400_000;

function resolve(site: EntitlementSubject, feature: Feature, ctx: EntitlementContext, now: Date): boolean {
  if (site.status === "suspended" || ctx.disabled?.includes(feature)) return false;
  const forced = override(site.featureOverrides, feature, featureOverrideSchema, now);
  if (forced) return forced.on;
  return Boolean(getPlan(site.planId)?.features.has(feature) || site.addons.includes(feature)
    || (inTrial(site, now) && plans.premium.features.has(feature)));
}

/** Kill switch → unexpired tenant override → plan + addons + trial; prerequisites must resolve too. */
export function can(site: EntitlementSubject, feature: string, ctx: EntitlementContext = {}): boolean {
  if (!isFeature(feature)) return false;
  const now = ctx.now ?? new Date();
  return resolve(site, feature, ctx, now) && (featureDependencies[feature] ?? []).every(dep => resolve(site, dep, ctx, now));
}
export const canUse = (site: EntitlementSubject, ctx: EntitlementContext = {}) => (feature: string) => can(site, feature, ctx);

/** Plan limit plus an unexpired `limitOverrides[key].add`; unknown plan → 0. */
export function limit(site: EntitlementSubject, key: LimitKey, ctx: EntitlementContext = {}): number {
  const base = getPlan(site.planId)?.limits[key] ?? 0;
  return base + (override(site.limitOverrides, key, limitOverrideSchema, ctx.now ?? new Date())?.add ?? 0);
}

export class EntitlementError extends Error {
  constructor(readonly code: Feature | LimitKey, readonly status: 403 | 413, message: string) {
    super(message);
    this.name = "EntitlementError";
  }
}
export function assertCan(site: EntitlementSubject, feature: Feature, ctx?: EntitlementContext): void {
  if (!can(site, feature, ctx)) throw new EntitlementError(feature, 403, `Gói dịch vụ hiện tại không có tính năng "${featureLabels[feature]}".`);
}

const GB = 1024 ** 3;
const gb = (bytes: number) => (bytes / GB).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
/** `used`/`adding` are counts, or bytes for `mediaGb` (413 like an oversized upload); other limits answer 403. */
export function assertWithinLimit(site: EntitlementSubject, key: LimitKey, used: number, adding: number, ctx?: EntitlementContext): void {
  const max = limit(site, key, ctx);
  if (key === "mediaGb") {
    if (used + adding > max * GB) throw new EntitlementError(key, 413, `Vượt dung lượng media của gói: đã dùng ${gb(used)} GB, tệp mới ${gb(adding)} GB, giới hạn ${max} GB.`);
    return;
  }
  if (used + adding > max) throw new EntitlementError(key, 403, `Vượt giới hạn "${limitLabels[key]}" của gói (tối đa ${max}).`);
}
