import CmsFormLab from "./CmsFormLab";

/** Lab E7-S03: form CMS tự sinh chạy trong Next thật (SSR + hydrate) để e2e không cần DB/đăng nhập admin. */
export default function CmsFormPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-fg">[DỮ LIỆU MẪU] Form dự toán (CMS)</h1>
      <CmsFormLab />
    </main>
  );
}
