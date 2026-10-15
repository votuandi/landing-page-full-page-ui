import { requestSite, tenantSitemapPaths } from "@/lib/tenant/seoData";
import { isNoindexHost, siteOrigin, sitemapXml } from "@/lib/tenant/seo";

export async function GET(_request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const site = await requestSite((await params).siteId);
  if (!site || isNoindexHost(site.primaryHost)) return new Response("Không tìm thấy sitemap.", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(sitemapXml(siteOrigin(site), await tenantSitemapPaths(site)), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
