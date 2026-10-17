import type { ReactNode } from "react";
import Link from "next/link";

export type AdminNavItem = { href: string; label: string; current?: boolean };
export type AdminNavGroup = { label?: string; items: AdminNavItem[] };

function AdminNavigation({ nav }: { nav: AdminNavGroup[] }) {
  return <nav aria-label="Điều hướng quản trị" className="space-y-6">
    {nav.map((group, index) => <div key={group.label ?? index}>
      {group.label && <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">{group.label}</p>}
      <ul className="space-y-0.5">
        {group.items.map(item => <li key={item.href}>
          <Link prefetch={false} href={item.href} aria-current={item.current ? "page" : undefined}
            className={`flex min-h-11 items-center rounded-button px-3 py-2 text-sm no-underline transition-colors motion-reduce:transition-none ${item.current ? "bg-primary font-semibold text-on-primary" : "text-fg hover:bg-bg-tint"}`}>
            {item.label}
          </Link>
        </li>)}
      </ul>
    </div>)}
  </nav>;
}

/** Server shell; native details keeps the mobile navigation usable without JavaScript. */
export function AdminShell({ brand, nav, banners, account, children }: {
  brand: ReactNode;
  nav: AdminNavGroup[];
  banners?: ReactNode;
  account?: ReactNode;
  children: ReactNode;
}) {
  return <div className="min-h-screen lg:pl-72">
    <aside aria-label="Quản trị" className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-line/15 bg-bg-elevated lg:flex">
      <div className="px-6 pb-4 pt-6 font-semibold text-primary">{brand}</div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6"><AdminNavigation nav={nav} /></div>
      {account && <div className="border-t border-line/15 p-6">{account}</div>}
    </aside>
    <header className="border-b border-line/15 bg-bg-elevated lg:hidden">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span className="font-semibold text-primary">{brand}</span>
          <span className="inline-flex min-h-11 items-center rounded-button border border-line/25 px-4 text-sm font-semibold text-fg">
            <span className="group-open:hidden">Menu</span><span className="hidden group-open:inline">Đóng</span>
          </span>
        </summary>
        <div className="border-t border-line/15 px-3 pb-5 pt-4"><AdminNavigation nav={nav} /></div>
        {account && <div className="border-t border-line/15 p-4">{account}</div>}
      </details>
    </header>
    <div className="min-w-0">
      {banners && <div role="region" aria-label="Thông báo quản trị" className="border-b border-line/15 bg-bg-tint px-4 py-4 text-fg sm:px-8">{banners}</div>}
      <main id="noi-dung" tabIndex={-1} className="w-full max-w-5xl p-4 sm:p-8 lg:p-10">{children}</main>
    </div>
  </div>;
}
