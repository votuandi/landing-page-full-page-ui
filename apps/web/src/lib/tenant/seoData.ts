import { headers } from "next/headers";
import { loadTenantSite, listPublishedSlugs, type TenantSite } from "./siteData";
import { tenantCollections, type TenantCollections } from "./collections";
import { sitemapPaths } from "./seo";

export async function requestSite(siteId: string) {
  const request = await headers();
  if (request.get("x-site-id") !== siteId) return null;
  return loadTenantSite(request.get("x-tenant-id") ?? "", siteId);
}
export async function collectSitemapPaths(site: Pick<TenantSite, "tenantId" | "siteId" | "profile">, collections: TenantCollections, slugs: string[]) {
  const [products, services, projects, posts] = await Promise.all([collections.products(), collections.services(), collections.projects(), collections.posts()]);
  const slug = (items: { slug: string }[]) => items.map((item) => item.slug);
  return sitemapPaths({ pages: slugs, products: slug(products), services: slug(services), projects: slug(projects), posts: slug(posts),
    policies: site.profile.legal.policies.map((policy) => policy.slug) });
}
export async function tenantSitemapPaths(site: TenantSite) {
  return collectSitemapPaths(site, tenantCollections(site.tenantId, site.locale), await listPublishedSlugs(site.tenantId, site.siteId));
}
