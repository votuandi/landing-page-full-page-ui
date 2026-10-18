import { z } from "zod";
import { companyProfileSchema, mergeCompanyProfile, siteProfileSchema } from "./siteProfile.ts";
import { collectionInputSchema } from "./collections.ts";
import { saveCollectionItem } from "./collectionWrite.ts";
import { forTenant, forPlatform } from "./repository.ts";
import { saveSiteSettings, SiteSettingsError } from "./siteSettings.ts";
import type { PlatformDb } from "./client.ts";

const record = z.record(z.string(), z.unknown());
const object = (value: unknown) => record.parse(value);
const optional = (value: unknown) => value === "" ? undefined : value;
export function mapSiteConfig(config: unknown) {
  const c = object(config), brand = object(c.brand ?? {}), legal = object(c.legal ?? {});
  const rawBranches = z.array(record).parse(c.branches ?? []);
  const ids = new Set<string>();
  for (const [index, branch] of rawBranches.entries()) {
    const id = z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse(branch.id);
    if (!id.success || ids.has(id.data)) throw new SiteSettingsError(`branches.${index}.id: Mã chi nhánh phải hợp lệ và không trùng nhau`, 400);
    ids.add(id.data);
  }
  const primary = rawBranches.find(b => b.primary) ?? rawBranches[0];
  const branches = rawBranches.map(b => collectionInputSchema("branch").parse({
    slug: b.id, title: typeof b.name === "string" ? { vi: b.name } : b.name,
    status: "published", columns: { isPrimary: b.primary ?? false }, data: { ...b, hours: b.hours ?? b.openingHours },
  }));
  const reviews = object(c.reviews ?? {});
  const mappedProfile = siteProfileSchema.safeParse({
    ...c, name: brand.name, description: brand.description, email: brand.email,
    hotline: primary ? object(primary.hotline).main : undefined,
    brand: { ...brand, logo: optional(brand.logo), logoDark: optional(brand.logoDark) },
    legal: { ...legal, policies: [] , moitBadge: legal.moitBadge ? { ...object(legal.moitBadge), url: optional(object(legal.moitBadge).url) } : undefined },
    messenger: optional(c.messenger),
    reviews: Object.fromEntries(Object.entries(reviews).filter(([, value]) => object(value).url !== "")),
    megaMenu: { pricing: c.pricing, equipment: c.equipment },
  }, { error: z.locales.vi().localeError });
  if (!mappedProfile.success) throw new SiteSettingsError(mappedProfile.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "), 400);
  const { i18n } = z.object({ i18n: z.object({ enabled: z.boolean().default(false), defaultLang: z.enum(["vi", "en"]).default("vi") }) })
    .parse({ i18n: c.i18n ?? {} }, { error: z.locales.vi().localeError });
  const locales = i18n.enabled ? ["vi", "en"] : ["vi"];
  const defaultLocale: "vi" | "en" = i18n.enabled && i18n.defaultLang === "en" ? "en" : "vi";
  const mapped = new Set(["brand", "branches", "legal", "zalo", "messenger", "complaintHotline", "workingHours", "callbackHours", "socials", "stats", "reviews", "commitments", "popup", "topBar", "pricing", "equipment", "i18n", "theme"]);
  const unmapped = Object.keys(c).filter(key => !mapped.has(key)).map(key => `${key}: thuộc section/collection — E13-S02`);
  unmapped.push("legal.policies: thuộc section/collection — E13-S02", "brand.ogImage: thuộc SEO — E13-S02");
  return { profile: mappedProfile.data, locales, defaultLocale, branches, unmapped };
}

export async function importSiteConfig(db: PlatformDb, slug: string, config: unknown) {
  // Validate all input before looking up or mutating a tenant.
  const mapped = mapSiteConfig(config);
  const target = await forPlatform(db).tenants.bySlug(slug);
  if (!target) throw new SiteSettingsError("Không tìm thấy tenant", 404);
  const repo = forTenant(db, target.tenantId), site = await repo.site.get(target.siteId);
  if (!site) throw new SiteSettingsError("Không tìm thấy website", 404);
  const profile = mergeCompanyProfile(site.profile, companyProfileSchema.parse(mapped.profile));
  await saveSiteSettings(db, target.tenantId, target.siteId, { profile, locales: mapped.locales as ("vi" | "en")[], defaultLocale: mapped.defaultLocale }, site.updatedAt);
  for (const branch of mapped.branches) {
    const before = await repo.branch.first({ where: { slug: branch.slug } });
    await saveCollectionItem(db, target.tenantId, "branch", { ...branch, ...(before ? { id: before.id } : {}) });
  }
  await repo.auditLog.create({ actorType: "system", action: "site.import-config", entity: "Site", entityId: target.siteId, data: { branches: mapped.branches.length, unmapped: mapped.unmapped } });
  return mapped;
}
