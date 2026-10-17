import { collectionTag, pageTag, siteTag, tenantTag } from "@solar/cache";
import { PAGE_TAGS } from "./entitlements";

export const COLLECTIONS = ["product", "productCategory", "brand", "project", "post", "story", "testimonial", "branch", "faq", "service", "certificate", "pressItem"] as const;

/**
 * `cacheTag`s of a cached tenant page/chrome. Any section may read any collection, so every collection tag is attached:
 * publishing one collection refreshes that tenant's pages only; the process data cache stays per collection (S05).
 */
export const tenantPageTags = (tenantId: string, slug: string) => [tenantTag(tenantId), siteTag(tenantId), pageTag(tenantId, slug),
  ...COLLECTIONS.map((name) => collectionTag(tenantId, name)), ...PAGE_TAGS];

/** UI freshness; the request kill-switch snapshot is also part of every UI key, so the data/UI TTLs cannot accumulate. */
export const TENANT_CACHE_LIFE = { stale: 60, revalidate: 60, expire: 86_400 };
