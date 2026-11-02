import { notFound } from "next/navigation";
import { requirePagePermission } from "../../../../../lib/auth.ts";
import { loadBuilder } from "../../../../../lib/pageSections.ts";
import { pageSectionDeps } from "../../../../../lib/pageSectionRuntime.ts";
import Builder from "./Builder";

export default async function BuilderPage({ params }: { params: Promise<{ pageId: string }> }) {
  const editor = await loadBuilder((await params).pageId, { ...pageSectionDeps, requirePermission: requirePagePermission });
  if (!editor) notFound();
  return <Builder key={editor.page.id} editor={editor} />;
}
