import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminTheme, themeFontCss } from "@solar/themes";
import { themeToCss } from "@solar/tokens";
import { getAdminSession } from "../lib/auth.ts";
import "./globals.css";

export const metadata: Metadata = { title: "Quản trị website", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-admin-path");
  if (pathname && pathname !== "/doi-mat-khau" && (await getAdminSession())?.mustChangePassword) redirect("/doi-mat-khau");
  return <html lang="vi" data-theme="light"><head><style>{themeToCss(adminTheme) + themeFontCss(adminTheme)}</style></head>
    <body className="min-h-screen bg-bg font-sans text-fg antialiased">
      <Link prefetch={false} href="#noi-dung" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-bg-elevated focus:p-3">Đến nội dung chính</Link>
      {children}
    </body></html>;
}
