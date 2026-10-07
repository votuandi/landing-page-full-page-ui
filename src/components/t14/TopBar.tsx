"use client";

import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { siteConfig } from "@/config/site.config";
import { useLang } from "@/i18n/LangProvider";

/**
 * Dải cam kết chạy ngang (marquee) — chạy bằng CSS animation (globals.css: .t14-marquee),
 * dừng khi rê chuột/focus; prefers-reduced-motion → đứng yên, vuốt ngang được.
 */
export default function TopBar() {
  const { tr } = useLang();
  const { enabled, items } = siteConfig.topBar;
  if (!enabled || !items.length) return null;

  const group = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className={`flex shrink-0 items-center gap-10 pr-10 ${hidden ? "t14-marquee-dup" : ""}`}>
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2 whitespace-nowrap">
          <CheckBadgeIcon aria-hidden className="h-4 w-4 text-accent" />{tr(item)}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="t12-invert relative z-[55] border-b border-line/10 bg-bg-deep text-xs font-bold text-fg-muted">
      <div className="t14-marquee t12-no-scrollbar py-2" aria-label={tr("Cam kết của chúng tôi", "Our commitments")} role="region">
        <div className="t14-marquee-track flex w-max">{group(false)}{group(true)}</div>
      </div>
    </div>
  );
}
