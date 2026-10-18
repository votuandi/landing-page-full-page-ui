import { notFound } from "next/navigation";
import { requirePagePermission } from "../../../../../../lib/auth.ts";
import { loadSectionContent } from "../../../../../../lib/pageSections.ts";
import { pageSectionDeps } from "../../../../../../lib/pageSectionRuntime.ts";
import SectionContentEditor from "./SectionContentEditor";

export default async function SectionContentPage({ params }: { params: Promise<{ pageId: string; sectionId: string }> }) {
  const { pageId, sectionId } = await params;
  const editor = await loadSectionContent(pageId, sectionId, { ...pageSectionDeps, requirePermission: requirePagePermission });
  if (!editor) notFound();
  const tenant = await pageSectionDeps.tenant();
  const previewUrl = await pageSectionDeps.preview(tenant.tenantId, tenant.siteId, tenant.slug, editor.previewPath);
  return <SectionContentEditor key={`${pageId}:${sectionId}:${editor.page.revision}`} editor={editor} previewUrl={previewUrl} />;
}
