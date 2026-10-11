import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function SitePlaceholder({ params }: { params: Promise<{ siteId: string; path?: string[] }> }) {
  const { siteId, path = [] } = await params;
  if ((await headers()).get("x-site-id") !== siteId) notFound();
  return <main className="bg-bg text-fg p-8">
    <p className="text-fg-muted">[DỮ LIỆU MẪU] Trang tạm E5-S03</p>
    <h1>Site {siteId} · /{path.join("/")}</h1>
  </main>;
}
