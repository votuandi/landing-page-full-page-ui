import type { Metadata } from "next";
import { t15, themeFontCss } from "@solar/themes";
import { themeToCss } from "@solar/tokens";
import "./globals.css";
import NotFound from "./(site)/not-found";

// Two root layouts ((site) and the tenant tree, E5-S06) leave unmatched URLs without a layout.
export const metadata: Metadata = { title: "Không tìm thấy trang", robots: { index: false, follow: false } };

export default function GlobalNotFound() {
  return <html lang="vi" data-theme="light"><head><style dangerouslySetInnerHTML={{ __html: themeToCss(t15) + themeFontCss(t15) }} /></head><body><NotFound /></body></html>;
}
