import Link from "next/link";
import { requirePagePermission } from "../../../lib/auth.ts";
import { getSiteEntitlements } from "../../../lib/entitlements.ts";
import { sectionFormTypes } from "../../../lib/sectionForms.ts";

export default async function Content() {
  await requirePagePermission("content.edit");
  const types = sectionFormTypes(await getSiteEntitlements());
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-fg">Nội dung</h1>
        <p className="text-sm text-fg-muted">Form nội dung của từng loại section. Quản lý collection (sản phẩm, dự án…) sẽ có ở story E7-S06.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {types.map((def) => (
          <li key={def.type}>
            <Link href={`/noi-dung/form/${def.type}`}
              className="flex min-h-14 items-center justify-between gap-3 rounded-card border border-line/15 bg-bg-elevated px-4 py-3 text-fg hover:border-primary/40 hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <span className="font-medium">{def.meta.label.vi}</span>
              <span aria-hidden className="text-fg-subtle">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
