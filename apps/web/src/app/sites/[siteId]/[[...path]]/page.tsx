import { cache } from "react";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { PageRenderer, createCollectionLoader } from "@solar/sections";
import { loadTenantSite, loadPublishedPage, planCanUse } from "@/lib/tenant/siteData";
import { tenantCollections } from "@/lib/tenant/collections";
import { resolveRoute } from "@/lib/tenant/routes";
import { tenantMetadata } from "@/lib/tenant/metadata";
import { matchRedirect } from "@/lib/tenant/seo";
import { loadSystemPage, SystemContent, SystemFrame } from "@/components/tenant/SystemPages";

type Props = { params: Promise<{ siteId: string; path?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const load = cache(async (siteId: string, slug: string) => {
  const request = await headers();
  if (request.get("x-site-id") !== siteId) notFound();
  const site = await loadTenantSite(request.get("x-tenant-id") ?? "", siteId);
  if (!site) notFound();
  const route = resolveRoute(slug ? slug.split("/") : []);
  const page = route?.kind === "page" ? await loadPublishedPage(site.tenantId, siteId, slug, site.locale) : null;
  const system = route && route.kind !== "page" ? await loadSystemPage(site, route) : null;
  if (!page && !system) {
    // Legacy slugs configured per tenant (Site.seo.redirects) → 308.
    const target = matchRedirect(site.seo.redirects, `/${slug}`);
    if (target) permanentRedirect(target);
    notFound();
  }
  return { site, page, system };
});
export async function generateMetadata({ params }: Props) {
  const { siteId, path = [] } = await params;
  const { site, page, system } = await load(siteId, path.join("/"));
  return tenantMetadata(site, `/${path.join("/")}`, page?.title || system?.title, system?.description, { image: system && "image" in system ? system.image : undefined });
}
export default async function TenantPage({ params }: Props) {
  const { siteId, path = [] } = await params;
  const slug = path.join("/");
  const { site, page, system } = await load(siteId, slug);
  if (system) return <SystemFrame title={system.title} description={system.description}>{system.content}</SystemFrame>;
  if (!page) notFound();
  const config = { sections: page.config.sections.filter((section) => !["site-header", "site-footer"].includes(section.type)) };
  if (page.kind === "system") return <SystemFrame title={page.title}><SystemContent site={site} slug={slug} config={config} /></SystemFrame>;
  return <main><PageRenderer page={config} site={site.context} canUse={planCanUse(site.planId)} loadData={createCollectionLoader(tenantCollections(site.tenantId, site.locale).source)} /></main>;
}
