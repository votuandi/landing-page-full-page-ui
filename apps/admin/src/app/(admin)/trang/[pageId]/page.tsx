import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePagePermission } from "../../../../lib/auth.ts";
import { loadPageEditor } from "../../../../lib/pageSections.ts";
import { pageSectionDeps } from "../../../../lib/pageSectionRuntime.ts";
import PageSectionsEditor from "./PageSectionsEditor";

export default async function PageSections({ params }: { params: Promise<{ pageId: string }> }) {
  const editor = await loadPageEditor((await params).pageId, { ...pageSectionDeps, requirePermission: requirePagePermission });
  if (!editor) notFound();
  return <section className="min-w-0 space-y-6">
    <Link href="/trang" className="inline-flex min-h-11 items-center rounded-button text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Về danh sách trang</Link>
    <h1 className="break-words text-2xl font-semibold text-fg">{editor.page.title}</h1>
    <PageSectionsEditor key={`${editor.page.id}:${editor.page.revision}`} editor={editor} />
  </section>;
}
