export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main id="noi-dung" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
    <p className="mb-6 font-semibold text-primary">Solar · Quản trị website</p>
    <div className="rounded-card border border-line/15 bg-bg-elevated p-6 shadow-sm sm:p-8">{children}</div>
  </main>;
}
