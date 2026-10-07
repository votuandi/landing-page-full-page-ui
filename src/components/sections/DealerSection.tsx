"use client";

import { useState } from "react";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import { siteConfig } from "@/config/site.config";
import { useLang } from "@/i18n/LangProvider";
import { useInViewOnce } from "@/lib/useCountUp";
import { MediaImage } from "@/components/ui/Media";
import { CarouselNav, CountUp, SectionHead } from "@/components/ui/ui";
import { pad2, useSnapCarousel } from "@/components/ui/useSnapCarousel";
import DealerForm from "@/components/sections/DealerForm";

const { stats, policies, faqs, gallery } = siteConfig.dealer;
type Tab = "policy" | "faq";

export default function DealerSection() {
  const { tr } = useLang();
  const [tab, setTab] = useState<Tab>("policy");
  const [ref, seen] = useInViewOnce<HTMLDListElement>(0.3);
  const c = useSnapCarousel();

  return (
    <section id="dai-ly" className="t15-invert t15-section relative overflow-hidden t15-ocean text-fg" aria-labelledby="dai-ly-title">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-accent)/.22),transparent_65%)]" />
      <div className="t15-container relative">
        <SectionHead id="dai-ly-title" eyebrow={tr("Trở thành đại lý", "Become a dealer")}
          title={tr("Cùng phân phối điện mặt trời tại địa phương của bạn.", "Distribute solar in your own region.")}
          desc={tr("Hàng chính hãng, đủ chứng từ, đào tạo kỹ thuật và bảo hành tại chi nhánh gần nhất.", "Genuine stock, full paperwork, technical training and warranty at your nearest branch.")} />

        <dl ref={ref} data-reveal-stagger="zoom" data-reveal-step="0.1" className="mt-10 grid grid-cols-3 gap-3 sm:gap-5">
          {stats.map((s) => (
            <div key={tr(s.label)} className="t15-glass-dark flex flex-col-reverse rounded-3xl p-4 text-center sm:p-6">
              <dt className="mt-1 text-xs font-semibold text-fg-muted sm:text-sm">{tr(s.label)}</dt>
              <dd className="text-3xl font-black tabular-nums text-accent-ink sm:text-5xl"><CountUp start={seen} value={s.value} />{s.suffix}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div data-reveal="left" className="t15-glass-dark rounded-[32px] p-5 sm:p-7">
            <div role="tablist" aria-label={tr("Thông tin đại lý", "Dealer info")} className="flex gap-2">
              {([["policy", tr("Chính sách", "Policy")], ["faq", tr("Hỏi đáp", "Q&A")]] as [Tab, string][]).map(([id, label]) => (
                <button key={id} type="button" role="tab" id={`dl-tab-${id}`} aria-controls="dl-panel" aria-selected={tab === id} onClick={() => setTab(id)} className="t15-chip">{label}</button>
              ))}
            </div>
            <div id="dl-panel" role="tabpanel" aria-labelledby={`dl-tab-${tab}`} className="mt-5">
              {tab === "policy" ? (
                <ul className="grid gap-4">
                  {policies.map((p) => (
                    <li key={p.title} className="flex gap-3">
                      <CheckBadgeIcon className="mt-0.5 h-6 w-6 shrink-0 text-accent-ink" />
                      <div><div className="font-black">{p.title}</div><p className="mt-1 text-sm leading-6 text-fg-muted">{p.body}</p></div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="grid gap-3">
                  {faqs.map(([q, a]) => (
                    <details key={q} className="group rounded-2xl border border-line/12 bg-glass px-5 py-4">
                      <summary className="cursor-pointer list-none pr-8 font-black">{q}<span aria-hidden className="float-right -mr-8 grid h-7 w-7 place-items-center rounded-full bg-glass-strong text-accent-ink transition group-open:rotate-45">+</span></summary>
                      <p className="mt-3 text-sm leading-7 text-fg-muted">{a}</p>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div data-reveal="right" className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-black">{tr("Hoạt động & sự kiện", "Events")}</div>
                <div className="text-sm font-black tabular-nums text-fg-muted" aria-hidden><span className="text-accent-ink">{pad2(c.index + 1)}</span> / {pad2(c.count || gallery.length)}</div>
              </div>
              <CarouselNav prev={c.prev} next={c.next} atStart={c.atStart} atEnd={c.atEnd} />
            </div>
            <div ref={c.ref} className="t15-no-scrollbar mt-4 flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto" aria-label={tr("Thư viện sự kiện", "Event gallery")}>
              {gallery.map((g) => (
                <figure key={g.title} className="relative min-h-[280px] w-[88%] shrink-0 snap-start overflow-hidden rounded-[28px] border border-glass-border sm:w-[70%]">
                  <MediaImage src={g.image} alt={g.title} sizes="(max-width:1024px) 85vw, 35vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-scrim/85 via-transparent to-transparent" />
                  <figcaption className="absolute inset-x-4 bottom-4 text-lg font-black text-on-media">{g.title}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>

        <div data-reveal="up" className="mt-8 grid gap-6 rounded-[32px] border border-glass-border bg-bg-deep/70 p-6 text-fg shadow-2xl backdrop-blur md:p-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <h3 className="text-2xl font-black sm:text-3xl">{tr("Đăng ký làm đại lý", "Apply now")}</h3>
            <p className="mt-2 text-sm leading-6 text-fg-muted">{tr("Để lại thông tin — phòng kinh doanh khu vực gửi chính sách chi tiết và bảng giá đại lý.", "Leave your details — our regional team will send the full policy and dealer price list.")}</p>
          </div>
          <DealerForm />
        </div>
      </div>
    </section>
  );
}
