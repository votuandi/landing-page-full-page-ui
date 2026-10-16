import { loadTenantSite } from "@/lib/tenant/siteData";
import { isNoindexHost, robotsTxt, siteOrigin } from "@/lib/tenant/seo";

// Only the proxy can reach /sites/** (E5-S06), so path params are the resolved tenant and site.
export async function GET(_request: Request, { params }: { params: Promise<{ tenantId: string; siteId: string }> }) {
  const { tenantId, siteId } = await params;
  const site = await loadTenantSite(tenantId, siteId);
  if (!site) return new Response("Không tìm thấy website.", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(robotsTxt(siteOrigin(site), isNoindexHost(site.primaryHost)), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
