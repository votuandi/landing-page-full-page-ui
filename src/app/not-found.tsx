import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-bg via-bg-elevated to-bg-tint px-4">
      <div className="text-center">
        <h1 className="text-8xl font-black tracking-[-.05em] text-primary sm:text-9xl">404</h1>
        <h2 className="mt-4 text-3xl font-black text-fg">Không tìm thấy trang</h2>
        <p className="mx-auto mt-4 max-w-md text-fg-muted">Trang bạn tìm không tồn tại hoặc đã được chuyển sang địa chỉ khác.</p>
        <Link href="/" className="t5-button t5-button-primary mt-8">Về trang chủ</Link>
      </div>
    </main>
  );
}
