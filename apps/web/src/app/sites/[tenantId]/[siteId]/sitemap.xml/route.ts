import { loadTenantSite } from "@/lib/tenant/siteData";
import { tenantSitemapPaths } from "@/lib/tenant/seoData";
import { isNoindexHost, siteOrigin, sitemapXml } from "@/lib/tenant/seo";

export async function GET(_request: Request, { params }: { params: Promise<{ tenantId: string; siteId: string }> }) {
  const { tenantId, siteId } = await params;
  const site = await loadTenantSite(tenantId, siteId);
  if (!site || isNoindexHost(site.primaryHost)) return new Response("Không tìm thấy sitemap.", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(sitemapXml(siteOrigin(site), await tenantSitemapPaths(site)), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
