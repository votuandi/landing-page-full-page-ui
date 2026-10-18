import Link from "next/link";
import { requirePagePermission } from "../../../lib/auth.ts";
import { getSiteEntitlements } from "../../../lib/entitlements.ts";
import { sectionFormTypes } from "../../../lib/sectionForms.ts";
import { loadCollectionIndex } from "../../../lib/collections.ts";
import { collectionDeps } from "../../../lib/collectionRuntime.ts";

export default async function Content() {
  await requirePagePermission("content.edit");
  const types = sectionFormTypes(await getSiteEntitlements());
  const collections = await loadCollectionIndex(collectionDeps);
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-fg">Nội dung</h1>
        <p className="text-sm text-fg-muted">Thêm và cập nhật nội dung hiển thị trên website.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {collections.map((def) => (
          <li key={def.name}>
            <Link href={`/noi-dung/${def.path}`}
              className="flex min-h-14 items-center justify-between gap-3 rounded-card border border-line/15 bg-bg-elevated px-4 py-3 text-fg hover:border-primary/40 hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <span className="font-medium">{def.label}</span>
              <span className="shrink-0 text-sm text-fg-muted">{def.count} bản ghi</span>
            </Link>
          </li>
        ))}
      </ul>
      <details className="text-sm text-fg-muted">
        <summary className="cursor-pointer py-3">Form section mẫu</summary>
        <ul className="flex flex-wrap gap-4">{types.map(def => <li key={def.type}><Link className="underline" href={`/noi-dung/form/${def.type}`}>{def.meta.label.vi}</Link></li>)}</ul>
      </details>
    </section>
  );
}
