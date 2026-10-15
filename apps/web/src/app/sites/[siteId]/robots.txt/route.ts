import { requestSite } from "@/lib/tenant/seoData";
import { isNoindexHost, robotsTxt, siteOrigin } from "@/lib/tenant/seo";

export async function GET(_request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const site = await requestSite((await params).siteId);
  if (!site) return new Response("Không tìm thấy website.", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(robotsTxt(siteOrigin(site), isNoindexHost(site.primaryHost)), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
