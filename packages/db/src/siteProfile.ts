import { z } from "zod";
import { richText } from "@solar/sections";
import { asset, contentImage, textValue } from "./collections.ts";

const https = z.url({ protocol: /^https$/ }).max(2000);
const phone = z.string().regex(/^[\d\s+.()-]{9,20}$/);
const short = z.string().max(500);
const nonnegative = z.number().nonnegative();
const review = z.object({ url: https, rating: z.number().min(0).max(5), count: nonnegative.int() });
const zaloContact = z.object({ label: textValue, phone });
const priceCategory = z.object({
  id: short, label: textValue, hint: textValue, segment: z.enum(["household", "shop", "factory", "farm", "project"]),
  groups: z.array(z.object({ title: textValue.optional(), chips: z.array(z.object({ label: textValue, bill: nonnegative.optional(), popular: z.boolean().optional() })).max(30) })).max(20),
});
const companyLegalSchema = z.object({
  businessRegistration: z.object({ number: short, issuedBy: short, issuedDate: short }).optional(),
  licenses: z.array(short).max(50).default([]), iso: z.array(short).max(50).default([]),
  moitBadge: z.object({ enabled: z.boolean(), url: https.optional() }).optional(),
});
export const siteProfileSchema = z.object({
  name: textValue.optional(), description: textValue.optional(), email: z.email().optional(), hotline: phone.optional(),
  brand: z.object({ legalName: textValue.optional(), tagline: textValue.optional(), logo: asset.optional(), logoDark: asset.optional(), favicon: z.uuid().optional(), logoText: z.string().max(4).optional(), foundedYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(), url: https.optional() }).default({}),
  theme: z.object({ default: z.enum(["light", "dark"]).default("light"), switcher: z.boolean().default(false) }).default({ default: "light", switcher: false }),
  legal: companyLegalSchema.extend({ policies: z.array(z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), title: textValue, summary: textValue, body: richText() })).default([]) }).prefault({}),
  zalo: z.object({ household: zaloContact.optional(), factory: zaloContact.optional(), project: zaloContact.optional() }).default({}),
  messenger: https.optional(), complaintHotline: phone.optional(), workingHours: textValue.optional(), callbackHours: z.number().int().min(1).max(72).optional(),
  socials: z.array(z.object({ id: z.enum(["facebook", "youtube", "tiktok", "zalo", "instagram"]), url: https, handle: short, followers: nonnegative.optional() })).max(10).default([]),
  stats: z.object({ enabled: z.boolean().default(false), mwp: nonnegative.optional(), projects: nonnegative.optional(), dealers: nonnegative.optional(), provinces: nonnegative.optional(), engineers: nonnegative.optional(), customers: nonnegative.optional() }).prefault({}),
  reviews: z.object({ google: review.optional(), trustpilot: review.optional() }).default({}),
  commitments: z.array(z.object({ title: textValue, desc: textValue })).max(8).default([]),
  popup: z.object({ enabled: z.boolean(), delayMs: z.number().int().min(0).max(600000), scrollRatio: z.number().min(0).max(1) }).default({ enabled: false, delayMs: 30000, scrollRatio: 0.6 }),
  topBar: z.object({ enabled: z.boolean(), items: z.array(textValue).max(10) }).default({ enabled: false, items: [] }),
  megaMenu: z.object({
    pricing: z.object({ enabled: z.boolean(), categories: z.array(priceCategory).max(20) }).default({ enabled: false, categories: [] }),
    equipment: z.object({ enabled: z.boolean(), groups: z.array(z.object({ id: short, label: textValue, category: short, filters: z.array(z.object({ label: textValue, query: z.record(z.string().max(100), z.string().max(500)).default({}) })).max(30) })).max(20) }).default({ enabled: false, groups: [] }),
  }).prefault({}),
  guide: z.object({
    items: z.array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/), label: textValue, href: z.string().regex(/^(?:#[a-z0-9-]+|\/[a-z0-9/-]+)$/).optional() })).default([]),
    glossary: z.array(z.tuple([textValue, textValue])).default([]), regulations: z.array(z.object({ title: textValue, note: textValue })).default([]), tariffs: z.array(z.tuple([z.string(), z.string()])).default([]),
  }).default({ items: [], glossary: [], regulations: [], tariffs: [] }),
  team: z.array(z.object({ name: textValue, role: textValue, image: contentImage })).default([]),
  timeline: z.array(z.tuple([z.string(), textValue, textValue])).default([]),
});

export const COMPANY_KEYS = ["name", "description", "email", "hotline", "brand", "legal", "zalo", "messenger", "complaintHotline", "workingHours", "callbackHours", "socials", "stats", "reviews", "commitments", "popup", "topBar", "megaMenu"] as const;
export const companyProfileSchema = siteProfileSchema.pick(Object.fromEntries(COMPANY_KEYS.map(key => [key, true])) as Record<typeof COMPANY_KEYS[number], true>).extend({ brand: siteProfileSchema.shape.brand.unwrap().omit({ favicon: true }).default({}), legal: companyLegalSchema.prefault({}) });
export type SiteProfile = z.output<typeof siteProfileSchema>;
/** Profile media UUIDs participate in the same publish pipeline as section images. */
export function siteProfileMediaIds(profile: unknown): string[] {
  const parsed = siteProfileSchema.pick({ team: true, brand: true }).safeParse(profile);
  return parsed.success ? [...new Set([parsed.data.brand.favicon, ...parsed.data.team.map(person => person.image)].filter((image): image is string => z.uuid().safeParse(image).success))] : [];
}
/** Only these fields belong to this form; preserve every other persisted key verbatim. */
export function mergeCompanyProfile(current: unknown, company: unknown) {
  const before = z.record(z.string(), z.unknown()).parse(current);
  const input = companyProfileSchema.parse(company, { error: z.locales.vi().localeError });
  const { policies: _ignored, ...legal } = before.legal && typeof before.legal === "object" ? before.legal as Record<string, unknown> : {};
  const favicon = (before.brand as { favicon?: unknown } | undefined)?.favicon;
  return { ...before, ...input, brand: { ...input.brand, ...(favicon !== undefined ? { favicon } : {}) }, legal: { ...legal, ...input.legal, policies: (before.legal as { policies?: unknown })?.policies ?? [] } };
}
