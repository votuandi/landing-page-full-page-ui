"use client";

import { DocumentTextIcon, MapPinIcon, PhoneIcon, BoltIcon } from "@heroicons/react/24/outline";
import { siteConfig } from "@/config/site.config";
import { primaryBranch, telHref, zaloHref } from "@/config/site";
import { useLang } from "@/i18n/LangProvider";
import { ZaloIcon } from "@/components/BrandIcons";
import { MediaImage } from "@/components/t14/Media";

/** Banner đội ngũ kỹ sư + CTA Zalo / hotline + nhắc khách gửi khu vực, công suất, hóa đơn điện. */
export default function EngineerBanner() {
  const { tr } = useLang();
  const { image } = siteConfig.engineerBanner;
  const { factory } = siteConfig.zalo;

  return (
    <section className="t12-invert relative isolate overflow-hidden bg-bg-deep text-fg" aria-labelledby="ky-su-title">
      <MediaImage src={image} alt="" sizes="100vw" className="-z-10 opacity-45" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-bg-deep via-bg-deep/85 to-bg-deep/30" />
      <div className="t5-container grid gap-8 py-16 md:py-20 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
        <div data-reveal="left">
          <span className="t5-eyebrow">{tr("Đội ngũ kỹ sư", "Engineering team")}</span>
          <h2 id="ky-su-title" className="mt-4 max-w-2xl text-4xl font-black tracking-[-.04em] sm:text-5xl">
            {tr(`${siteConfig.stats.engineers}+ kỹ sư sẵn sàng thiết kế cho công trình của bạn.`, `${siteConfig.stats.engineers}+ engineers ready to design your system.`)}
          </h2>
          <p className="mt-5 max-w-xl leading-7 text-fg-muted">{tr("Tư vấn miễn phí, báo giá trong 24 giờ, khảo sát tận nơi tại 34 tỉnh/thành.", "Free consultation, quote within 24 hours, on-site survey in 34 provinces.")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={zaloHref(factory.phone)} target="_blank" rel="noopener noreferrer" className="t5-button t5-button-primary min-h-12 text-base"><ZaloIcon className="h-5 w-5" />{tr("Chat Zalo với kỹ sư", "Chat with an engineer")}</a>
            <a href={telHref(primaryBranch.hotline.project)} className="t5-button t5-button-secondary min-h-12 text-base"><PhoneIcon className="h-5 w-5" />{primaryBranch.hotline.project}</a>
          </div>
        </div>
        <div data-reveal="right" className="t8-glass-dark rounded-[28px] p-6">
          <div className="text-sm font-black uppercase tracking-[.16em] text-accent-soft">{tr("Để báo giá nhanh, hãy gửi:", "For a fast quote, send us:")}</div>
          <ul className="mt-4 grid gap-3">
            {[
              [MapPinIcon, tr("Khu vực lắp đặt", "Installation area")],
              [BoltIcon, tr("Công suất mong muốn (kWp) hoặc thiết bị cần dùng", "Desired capacity (kWp) or loads")],
              [DocumentTextIcon, tr("Ảnh hóa đơn tiền điện 1–3 tháng gần nhất", "Photo of your last 1–3 electricity bills")],
            ].map(([Icon, text], i) => {
              const I = Icon as typeof MapPinIcon;
              return <li key={i} className="flex items-center gap-3 rounded-2xl bg-glass px-4 py-3 font-bold"><I className="h-5 w-5 shrink-0 text-accent" />{text as string}</li>;
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
