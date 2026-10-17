import Link from "next/link";
export default function Forbidden() {
  return <main id="noi-dung" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10 sm:px-8"><div className="rounded-card border border-line/15 bg-bg-elevated p-6 shadow-sm sm:p-8"><h1>Bạn không có quyền truy cập</h1><p>Liên hệ chủ site để được cấp quyền phù hợp.</p><p className="mt-4"><Link prefetch={false} href="/">Về tổng quan</Link></p></div></main>;
}
