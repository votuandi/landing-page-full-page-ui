import { notFound, permanentRedirect } from "next/navigation";
import { tenantMetadata } from "@/lib/tenant/metadata";
import { tenantRoute } from "@/lib/tenant/route";
import { TenantPageBody, tenantPageOutcome } from "@/components/tenant/cached";

type Props = { params: Promise<{ tenantId: string; siteId: string; ctx: string; path?: string[] }> };
async function load({ params }: Props) {
  const { tenantId, siteId, ctx, path = [] } = await params;
  const slug = path.join("/");
  const { site, preview } = await tenantRoute(tenantId, siteId, ctx);
  const key = { tenantId: site.tenantId, siteId: site.siteId, locale: site.locale, preview };
  const outcome = await tenantPageOutcome(key, slug);
  if (outcome.kind === "redirect") permanentRedirect(outcome.target);
  if (outcome.kind === "notFound") notFound();
  return { site, key, slug, outcome };
}
export async function generateMetadata(props: Props) {
  const { site, slug, outcome } = await load(props);
  return tenantMetadata(site, `/${slug}`, outcome.title, outcome.description, { image: outcome.image });
}
export default async function TenantPage(props: Props) {
  const { key, slug } = await load(props);
  return <TenantPageBody {...key} slug={slug} />;
}
