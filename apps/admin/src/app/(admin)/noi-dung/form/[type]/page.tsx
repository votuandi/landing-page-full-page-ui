import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePagePermission } from "../../../../../lib/auth.ts";
import { getSiteEntitlements } from "../../../../../lib/entitlements.ts";
import { loadSectionForm } from "../../../../../lib/sectionForms.ts";
import { SectionFormPreview } from "../../../../../components/SectionFormPreview.tsx";

export default async function SectionForm({ params }: { params: Promise<{ type: string }> }) {
  const form = await loadSectionForm((await params).type, { requirePermission: requirePagePermission, entitlements: getSiteEntitlements });
  if (!form) notFound();
  const { def, bilingual } = form;
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <Link href="/noi-dung" className="text-sm text-fg-muted hover:text-fg">← Nội dung</Link>
        <h1 className="text-2xl font-semibold text-fg">{def.meta.label.vi}</h1>
        <p className="text-sm text-fg-muted">Form sinh tự động từ schema của section. Lưu nháp và xem trước sẽ có ở bản sau; nút &quot;Kiểm tra&quot; chỉ xác nhận dữ liệu hợp lệ.</p>
      </div>
      <SectionFormPreview type={def.type} bilingual={bilingual} />
    </section>
  );
}
