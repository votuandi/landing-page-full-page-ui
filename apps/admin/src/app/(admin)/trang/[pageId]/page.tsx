import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenant, requirePagePermission } from "../../../../lib/auth.ts";
import { forTenant, parseAbTest, abTestStats } from "@solar/db";
import { sectionRegistry } from "@solar/sections";
import { isLandingSlug, parsePageSettings } from "@solar/presets";
import { getRuntime } from "../../../../lib/runtime.ts";
import { getSiteEntitlements } from "../../../../lib/entitlements.ts";
import { PageSettingsForm } from "./PageSettingsForm.tsx";
import { loadPageEditor, readSectionData } from "../../../../lib/pageSections.ts";
import { pageSectionDeps } from "../../../../lib/pageSectionRuntime.ts";
import PageSectionsEditor from "./PageSectionsEditor";
import { AbTestPanel } from "./AbTestPanel.tsx";

export default async function PageSections({ params }: { params: Promise<{ pageId: string }> }) {
  const editor = await loadPageEditor((await params).pageId, { ...pageSectionDeps, requirePermission: requirePagePermission });
  if (!editor) notFound();
  const session = await requirePagePermission("pages.view");
  const { tenantId, siteId } = await getTenant(), repo = forTenant(getRuntime().db, tenantId);
  const can = await getSiteEntitlements();
  const showLanding = isLandingSlug(editor.page.slug) && session.permissions.has("pages.structure");
  const [page, site] = showLanding ? await Promise.all([repo.page.get(editor.page.id), repo.site.get(siteId)]) : [null, null];
  const title = page?.title && typeof page.title === "object" && !Array.isArray(page.title) ? page.title as { vi: string; en?: string } : { vi: editor.page.title };
  const abTest = parseAbTest(page?.abTest);
  const stats = abTest && can("abTest") ? await abTestStats(getRuntime().db, tenantId, abTest.id) : null;
  const hero = editor.sections.find(section => section.type === "hero" && section.enabled);
  const heroRow = page && hero ? await repo.sectionContent.first({ where: { siteId, pageId: page.id, sectionId: hero.id } }) : null;
  const initial = hero ? sectionRegistry.types.hero.schema.parse(readSectionData(hero, sectionRegistry.types.hero, heroRow).data) : sectionRegistry.types.hero.defaults;
  return <section className="min-w-0 space-y-6">
    <Link href="/trang" className="inline-flex min-h-11 items-center rounded-button text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Về danh sách trang</Link>
    <h1 className="break-words text-2xl font-semibold text-fg">{editor.page.title}</h1>
    {page && site && can("landingPages") && <PageSettingsForm key={page.id} pageId={page.id} title={title} settings={parsePageSettings(page.settings)} locales={site.locales} />}
    {page && site && <AbTestPanel key={page.id} pageId={page.id} abTest={abTest}
      initial={{ title: initial.title, ctaLabel: initial.primaryCta.label }} stats={stats} allowed={can("abTest")} locales={site.locales} hasHero={!!hero} />}
    <PageSectionsEditor key={`${editor.page.id}:${editor.page.revision}`} editor={editor} />
  </section>;
}
