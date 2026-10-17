import { cache } from "react";
import { tenantRenderKey } from "@/lib/tenant/renderKey";
import { notFound, permanentRedirect } from "next/navigation";
import { tenantMetadata } from "@/lib/tenant/metadata";
import { tenantRoute } from "@/lib/tenant/route";
import { tenantPage } from "@/components/tenant/cached";

// Approved blocking tenant route (E5-S06): page data and metadata need the request context via tenantRoute().
// A layout's instant=false does not exempt this segment from client-navigation validation.
export const instant = false;

type Props = { params: Promise<{ tenantId: string; siteId: string; ctx: string; path?: string[] }> };
const resolve = cache(async (tenantId: string, siteId: string, ctx: string, slug: string) => {
  const { site, preview } = await tenantRoute(tenantId, siteId, ctx);
  const key = tenantRenderKey(site, preview);
  const outcome = await tenantPage(key, slug);
  if (outcome.kind === "redirect") permanentRedirect(outcome.target);
  if (outcome.kind === "notFound") notFound();
  return { site, slug, outcome };
});
async function load({ params }: Props) {
  const { tenantId, siteId, ctx, path = [] } = await params;
  return resolve(tenantId, siteId, ctx, path.join("/"));
}
export async function generateMetadata(props: Props) {
  const { site, slug, outcome } = await load(props);
  return tenantMetadata(site, `/${slug}`, outcome.title, outcome.description, { image: outcome.image });
}
export default async function TenantPage(props: Props) {
  return (await load(props)).outcome.content;
}
