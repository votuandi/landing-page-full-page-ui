"use client";

import { SITE_CONFIG, yearsOfExperience } from "@/config/site";
import { useCountUp, useInViewOnce } from "@/lib/useCountUp";
import { formatNumber } from "@/lib/solarCalculator";

function Stat({ value, decimals = 0, suffix, label, start }: { value: number; decimals?: number; suffix: string; label: string; start: boolean }) {
  const v = useCountUp(value, { duration: 1600, start });
  const text = decimals ? v.toFixed(decimals).replace(".", ",") : formatNumber(v);
  return (
    <div className="t8-glass-dark flex flex-col-reverse rounded-3xl p-6 text-center">
      <dt className="mt-2 text-sm font-semibold text-fg-muted">{label}</dt>
      <dd className="text-4xl font-black tabular-nums tracking-tight text-accent sm:text-5xl">{text}<span className="text-2xl">{suffix}</span></dd>
    </div>
  );
}

export default function StatsSection() {
  const [ref, seen] = useInViewOnce<HTMLDListElement>(0.3);
  const c = SITE_CONFIG.capabilities;
  return (
    <section className="t12-invert relative overflow-hidden bg-gradient-to-br from-bg-deep via-bg-tint to-primary-deep py-16 text-fg md:py-20" aria-label="Số liệu nổi bật">
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-accent)/.3),transparent_65%)]" />
      <div className="t5-container relative">
        <dl ref={ref} data-reveal-stagger="zoom" data-reveal-step="0.1" className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          <Stat start={seen} value={yearsOfExperience()} suffix="+" label="Năm kinh nghiệm" />
          <Stat start={seen} value={c.mwp} decimals={1} suffix=" MWp" label="Đã lắp đặt" />
          <Stat start={seen} value={c.customers} suffix="+" label="Khách hàng" />
          <Stat start={seen} value={c.technicians} suffix="" label="Kỹ thuật viên" />
        </dl>
      </div>
    </section>
  );
}
