import { notFound } from "next/navigation";
import { requirePagePermission } from "../../../../../lib/auth.ts";
import { loadBuilder } from "../../../../../lib/pageSections.ts";
import { pageSectionDeps } from "../../../../../lib/pageSectionRuntime.ts";
import BuilderDemo from "./BuilderDemo";

export default async function BuilderPage({ params }: { params: Promise<{ pageId: string }> }) {
  const data = await loadBuilder((await params).pageId, { ...pageSectionDeps, requirePermission: requirePagePermission });
  if (!data) notFound();
  return <BuilderDemo key={`${data.editor.page.id}:${data.editor.page.revision}`} data={data} />;
}
