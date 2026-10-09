"use client";

import { MediaImage, Wordmark, SectionHead } from "@solar/ui";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import { siteConfig, type BrandGroup } from "@/config/site.config";
import { isDistributor } from "@/config/site";
import { useLang } from "@/i18n/LangProvider";

const VideoModal = dynamic(() => import("@solar/ui").then((mod) => mod.VideoModal), { ssr: false });

const GROUP_LABEL: Record<BrandGroup, [string, string]> = {
  panel: ["Tấm pin", "Panel"], inverter: ["Inverter", "Inverter"], lithium: ["Lithium", "Lithium"], allinone: ["All-in-one", "All-in-one"], bess: ["BESS", "BESS"],
};

export default function BrandsSection() {
  const { tr } = useLang();
  const [playing, setPlaying] = useState(false);
  const { signingVideo, list } = siteConfig.brands;
  const title = tr(signingVideo.title);

  return (
    <section id="thuong-hieu" className="t15-section relative overflow-hidden bg-gradient-to-b from-bg-sky to-bg" aria-labelledby="thuong-hieu-title">
      <div className="t15-container">
        <SectionHead id="thuong-hieu-title" eyebrow={tr("Thương hiệu phân phối", "Distributed brands")}
          title={tr("Nhà phân phối ủy quyền — hàng chính hãng, bảo hành tại Việt Nam.", "Authorised distributor — genuine stock, local warranty.")}
          desc={tr("Ký kết trực tiếp với hãng, đủ chứng từ CO/CQ cho từng lô. Tên thương hiệu trong demo là hư cấu.", "Direct agreements with manufacturers, CO/CQ for every shipment. Brand names in this demo are fictional.")} />

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_1fr]">
          <button type="button" onClick={() => setPlaying(true)} data-reveal="left" aria-label={`${tr("Xem video", "Watch video")}: ${title}`}
            className="group relative min-h-[300px] overflow-hidden rounded-[32px] border border-glass-border text-left shadow-[0_30px_60px_-35px_rgb(var(--c-shadow)/.55)] sm:min-h-[380px]">
            <MediaImage src={signingVideo.poster} alt="" sizes="(max-width:1024px) 100vw, 52vw" className="transition duration-700 motion-safe:group-hover:scale-[1.04]" />
            <div className="absolute inset-0 bg-gradient-to-t from-scrim/90 via-scrim/30 to-transparent" />
            <span className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-on-accent shadow-2xl transition motion-safe:group-hover:scale-110">
              <span aria-hidden className="absolute inset-0 rounded-full bg-accent t15-ping" />
              <PlayIcon className="relative ml-1 h-9 w-9" />
            </span>
            <span className="absolute inset-x-0 bottom-0 p-6 text-on-media sm:p-8">
              <span className="rounded-full bg-accent/90 px-3 py-1 text-[11px] font-black uppercase tracking-[.14em] text-on-accent">{tr("Lễ ký kết", "Signing ceremony")}</span>
              <span className="mt-3 block text-2xl font-black leading-tight sm:text-3xl">{title}</span>
              <span className="mt-1 block text-sm text-on-media/80">{signingVideo.caption}</span>
            </span>
          </button>

          <div data-reveal-stagger="zoom" data-reveal-step="0.05" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {list.map((b) => {
              const [vi, en] = GROUP_LABEL[b.group];
              const body = <>
                <Wordmark name={b.name} src={b.logo} />
                <span className="text-[10px] font-black uppercase tracking-[.16em] text-fg-subtle">{tr(vi, en)}</span>
              </>;
              const cls = "t15-card flex min-h-[112px] flex-col items-center justify-center gap-2 p-4 text-center transition hover:border-primary/50";
              const category = b.group === "lithium" ? "battery" : b.group;
              return isDistributor
                ? <Link key={b.name} href={`/san-pham?category=${category}&brand=${encodeURIComponent(b.name)}`} className={cls}>{body}</Link>
                : <div key={b.name} className={cls}>{body}</div>;
            })}
          </div>
        </div>

        {isDistributor && (
          <div className="mt-8 text-center">
            <Link href="/san-pham" className="inline-flex items-center gap-2 text-sm font-black text-primary hover:gap-3">{tr("Xem toàn bộ thiết bị", "Browse all equipment")} <ArrowRightIcon className="h-4 w-4" /></Link>
          </div>
        )}
      </div>
      {playing && <VideoModal closeLabel={tr("Đóng video", "Close video")} video={signingVideo.video} title={title} onClose={() => setPlaying(false)} />}
    </section>
  );
}
