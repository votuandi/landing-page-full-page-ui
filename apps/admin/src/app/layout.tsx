import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { t15, themeFontCss } from "@solar/themes";
import { themeToCss } from "@solar/tokens";
import { getAdminSession } from "../lib/auth.ts";
import "./globals.css";

export const metadata: Metadata = { title: "Quản trị website", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-admin-path");
  if (pathname && pathname !== "/doi-mat-khau" && (await getAdminSession())?.mustChangePassword) redirect("/doi-mat-khau");
  return <html lang="vi" data-theme="light"><head><style>{themeToCss(t15) + themeFontCss(t15)}</style></head>
    <body className="min-h-screen bg-bg font-sans text-fg antialiased">
      <Link prefetch={false} href="#noi-dung" className="sr-only focus:not-sr-only">Đến nội dung chính</Link>
      <main id="noi-dung" className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <p className="mb-6 font-semibold text-primary">Solar · Quản trị website</p>
        <div className="rounded-card border border-line/15 bg-bg-elevated p-6 shadow-sm sm:p-8">{children}</div>
      </main>
    </body></html>;
}
