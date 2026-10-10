import Link from "next/link";

export default function NotFound() {
  return (
    <main className="t15-screen relative isolate overflow-hidden bg-gradient-to-br from-bg via-bg-elevated to-bg-tint">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 -z-10 h-[520px] w-[520px] rounded-full bg-glow-primary-25" />
      <div className="t15-container py-20 text-center">
        <div className="text-8xl font-black tracking-[-.05em] text-primary sm:text-9xl">404</div>
        <h1 className="mt-4 text-3xl font-black text-fg">Không tìm thấy trang</h1>
        <p className="mx-auto mt-4 max-w-md text-fg-muted">Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="t15-button t15-button-secondary">Về trang chủ</Link>
          <Link href="/#du-toan" className="t15-button t15-button-primary">Dự toán chi phí lắp đặt</Link>
        </div>
      </div>
    </main>
  );
}
