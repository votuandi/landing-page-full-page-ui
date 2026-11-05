import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenant, requirePagePermission } from "../../../../lib/auth.ts";
import { forTenant } from "@solar/db";
import { isLandingSlug, parsePageSettings } from "@solar/presets";
import { getRuntime } from "../../../../lib/runtime.ts";
import { getSiteEntitlements } from "../../../../lib/entitlements.ts";
import { PageSettingsForm } from "./PageSettingsForm.tsx";
import { loadPageEditor } from "../../../../lib/pageSections.ts";
import { pageSectionDeps } from "../../../../lib/pageSectionRuntime.ts";
import PageSectionsEditor from "./PageSectionsEditor";

export default async function PageSections({ params }: { params: Promise<{ pageId: string }> }) {
  const editor = await loadPageEditor((await params).pageId, { ...pageSectionDeps, requirePermission: requirePagePermission });
  if (!editor) notFound();
  const session = await requirePagePermission("pages.view");
  const { tenantId, siteId } = await getTenant(), repo = forTenant(getRuntime().db, tenantId);
  const can = await getSiteEntitlements();
  const showSettings = isLandingSlug(editor.page.slug) && session.permissions.has("pages.structure") && can("landingPages");
  const [page, site] = showSettings ? await Promise.all([repo.page.get(editor.page.id), repo.site.get(siteId)]) : [null, null];
  const title = page?.title && typeof page.title === "object" && !Array.isArray(page.title) ? page.title as { vi: string; en?: string } : { vi: editor.page.title };
  return <section className="min-w-0 space-y-6">
    <Link href="/trang" className="inline-flex min-h-11 items-center rounded-button text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Về danh sách trang</Link>
    <h1 className="break-words text-2xl font-semibold text-fg">{editor.page.title}</h1>
    {page && site && <PageSettingsForm key={page.id} pageId={page.id} title={title} settings={parsePageSettings(page.settings)} locales={site.locales} />}
    <PageSectionsEditor key={`${editor.page.id}:${editor.page.revision}`} editor={editor} />
  </section>;
}
