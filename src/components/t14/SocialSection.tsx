"use client";

import { siteConfig } from "@/config/site.config";
import { useLang } from "@/i18n/LangProvider";
import { useInViewOnce } from "@/lib/useCountUp";
import { FacebookIcon, TikTokIcon, YouTubeIcon, ZaloIcon } from "@/components/BrandIcons";
import { CountUp } from "@/components/t14/ui";

const ICONS = { facebook: FacebookIcon, youtube: YouTubeIcon, tiktok: TikTokIcon, zalo: ZaloIcon } as const;
const compact = (n: number, lang: "vi" | "en") =>
  new Intl.NumberFormat(lang === "en" ? "en" : "vi", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export default function SocialSection() {
  const { tr, lang } = useLang();
  const [ref, seen] = useInViewOnce<HTMLDivElement>(0.3);
  const list = siteConfig.socials.filter((s) => s.url);
  const total = list.reduce((sum, s) => sum + s.followers, 0);
  if (!list.length) return null;

  return (
    <section id="mang-xa-hoi" className="t5-section bg-bg" aria-labelledby="mxh-title">
      <div ref={ref} className="t5-container grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
        <div data-reveal="left">
          <span className="t5-eyebrow">{tr("Mạng xã hội", "Social media")}</span>
          <h2 id="mxh-title" className="t5-heading">{tr("Cộng đồng cùng theo dõi hành trình xanh.", "A community following our green journey.")}</h2>
          <div className="mt-6">
            <div className="text-6xl font-black tabular-nums tracking-tight text-accent sm:text-7xl"><CountUp start={seen} value={total} duration={1800} />+</div>
            <div className="mt-1 font-bold text-fg-muted">{tr("người theo dõi trên tất cả kênh", "followers across all channels")}</div>
          </div>
        </div>
        <ul data-reveal-stagger="up" data-reveal-step="0.08" className="grid grid-cols-2 gap-3 sm:gap-4">
          {list.map((s) => {
            const Icon = ICONS[s.id];
            return (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="t8-card group flex h-full flex-col gap-4 p-5 transition motion-safe:hover:-translate-y-1 sm:p-6">
                  <span className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary transition group-hover:bg-primary group-hover:text-on-primary"><Icon className="h-6 w-6" /></span>
                    <span className="text-xs font-black text-primary">{tr("Theo dõi", "Follow")} ↗</span>
                  </span>
                  <span>
                    <span className="block text-3xl font-black tabular-nums text-fg">{compact(s.followers, lang)}</span>
                    <span className="mt-1 block text-sm font-bold text-fg-muted">{s.label} · <span className="font-medium">{s.handle}</span></span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
