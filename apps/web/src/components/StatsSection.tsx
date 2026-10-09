"use client";

import { yearsOfExperience } from "@/config/site";
import { siteConfig } from "@/config/site.config";
import { useLang } from "@/i18n/LangProvider";
import { useCountUp, useInViewOnce } from "@/lib/useCountUp";
import { formatNumber } from "@solar/core";

function Stat({ value, decimals = 0, suffix, label, start }: { value: number; decimals?: number; suffix: string; label: string; start: boolean }) {
  const v = useCountUp(value, { duration: 1600, start });
  const text = decimals ? v.toFixed(decimals).replace(".", ",") : formatNumber(v);
  return (
    <div className="t15-glass-dark flex flex-col-reverse rounded-3xl p-6 text-center">
      <dt className="mt-2 text-sm font-semibold text-fg-muted">{label}</dt>
      <dd className="text-4xl font-black tabular-nums tracking-tight text-accent-ink sm:text-5xl">{text}<span className="text-2xl">{suffix}</span></dd>
    </div>
  );
}

export default function StatsSection() {
  const [ref, seen] = useInViewOnce<HTMLDListElement>(0.3);
  const c = siteConfig.stats;
  const { tr } = useLang();
  return (
    <section className="t15-invert relative overflow-hidden t15-ocean py-16 text-fg md:py-20" aria-label="Số liệu nổi bật">
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-accent)/.3),transparent_65%)]" />
      <div className="t15-container relative">
        <dl ref={ref} data-reveal-stagger="zoom" data-reveal-step="0.1" className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          <Stat start={seen} value={yearsOfExperience()} suffix="+" label={tr("Năm kinh nghiệm", "Years of experience")} />
          <Stat start={seen} value={c.mwp} decimals={1} suffix=" MWp" label={tr("Đã cung cấp & lắp đặt", "Supplied & installed")} />
          <Stat start={seen} value={c.projects} suffix="+" label={tr("Công trình", "Projects")} />
          <Stat start={seen} value={c.engineers} suffix="+" label={tr("Kỹ sư & kỹ thuật viên", "Engineers & technicians")} />
        </dl>
      </div>
    </section>
  );
}
