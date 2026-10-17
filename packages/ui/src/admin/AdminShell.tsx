import type { ReactNode } from "react";
import Link from "next/link";

export type AdminNavItem = { href: string; label: string; current?: boolean };
export type AdminNavGroup = { label?: string; items: AdminNavItem[] };

function AdminNavigation({ nav }: { nav: AdminNavGroup[] }) {
  return <nav aria-label="Điều hướng quản trị" className="space-y-6">
    {nav.map((group, index) => <div key={group.label ?? index}>
      {group.label && <p className="mb-2 px-3 text-sm font-semibold text-fg-muted">{group.label}</p>}
      <ul className="space-y-1">
        {group.items.map(item => <li key={item.href}>
          <Link prefetch={false} href={item.href} aria-current={item.current ? "page" : undefined}
            className={`block rounded-button px-3 py-3 text-sm no-underline ${item.current ? "bg-primary font-semibold text-on-primary" : "text-fg hover:bg-bg-tint"}`}>
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
      <div className="p-6 font-semibold text-primary">{brand}</div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6"><AdminNavigation nav={nav} /></div>
      {account && <div className="border-t border-line/15 p-6">{account}</div>}
    </aside>
    <header className="border-b border-line/15 bg-bg-elevated p-4 lg:hidden">
      <div className="font-semibold text-primary">{brand}</div>
      <details className="mt-4">
        <summary className="cursor-pointer rounded-button px-3 py-3 font-semibold">Menu</summary>
        <div className="mt-3"><AdminNavigation nav={nav} /></div>
        {account && <div className="mt-6 border-t border-line/15 pt-4">{account}</div>}
      </details>
    </header>
    <div className="min-w-0">
      {banners && <div role="region" aria-label="Thông báo quản trị" className="border-b border-line/15 bg-bg-tint px-4 py-4 text-fg sm:px-8">{banners}</div>}
      <main id="noi-dung" tabIndex={-1} className="p-4 sm:p-8">{children}</main>
    </div>
  </div>;
}
