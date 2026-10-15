import { headers } from "next/headers";
import { PAGE_TYPES } from "@solar/presets";
import { loadTenantSite, listPublishedSlugs, siteCanUse, type TenantSite } from "./siteData";
import { tenantCollections, type TenantCollections } from "./collections";
import { sitemapPaths } from "./seo";
import { resolveRoute, routeEnabled } from "./routes";

export async function requestSite(siteId: string) {
  const request = await headers();
  if (request.get("x-site-id") !== siteId) return null;
  return loadTenantSite(request.get("x-tenant-id") ?? "", siteId);
}
export async function collectSitemapPaths(site: Pick<TenantSite, "tenantId" | "siteId" | "profile" | "planId" | "addons" | "pageTypes">, collections: TenantCollections, slugs: string[]) {
  // Same structure/plan rule as the page dispatcher (E5-S11): closed pages never reach the sitemap.
  const canUse = siteCanUse(site);
  const open = (path: string[]) => { const route = resolveRoute(path); return Boolean(route && routeEnabled(route, site.pageTypes, canUse)); };
  const list = <T extends { slug: string }>(prefix: string, load: () => Promise<T[]>) => open([prefix, "x"]) ? load() : Promise.resolve([]);
  const [products, services, projects, posts] = await Promise.all([list(PAGE_TYPES.products.slug, collections.products), list(PAGE_TYPES.services.slug, collections.services),
    list(PAGE_TYPES.projects.slug, collections.projects), list(PAGE_TYPES.news.slug, collections.posts)]);
  const slug = (items: { slug: string }[]) => items.map((item) => item.slug);
  return sitemapPaths({ pages: slugs.filter((page) => open(page ? page.split("/") : [])), products: slug(products), services: slug(services), projects: slug(projects), posts: slug(posts),
    policies: site.profile.legal.policies.map((policy) => policy.slug) });
}
export async function tenantSitemapPaths(site: TenantSite) {
  return collectSitemapPaths(site, tenantCollections(site.tenantId, site.locale), await listPublishedSlugs(site.tenantId, site.siteId));
}
