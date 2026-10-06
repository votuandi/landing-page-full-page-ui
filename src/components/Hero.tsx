import Image from "next/image";
import Link from "next/link";
import ScrollAnimationWrapper from "./ScrollAnimationWrapper";
import StaggeredScrollAnimation from "./StaggeredScrollAnimation";
import { STATISTICS } from "@/utils/constants";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--solar-surface)] py-20 md:py-28">
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-orange-300/25 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div>
          <ScrollAnimationWrapper animation="fade-in-up">
            <span className="inline-flex rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-700">
              Năng lượng sạch • hiệu quả dài hạn
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.06] tracking-tight text-stone-900 md:text-6xl">
              Một hệ thống solar tốt bắt đầu từ <span className="text-[var(--solar-primary-dark)]">thiết kế đúng</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 md:text-xl">
              Minwy Solar tư vấn, cung cấp thiết bị và thi công điện mặt trời theo nhu cầu thực tế của từng công trình, với trọng tâm là hiệu suất, an toàn và khả năng vận hành lâu dài.
            </p>
          </ScrollAnimationWrapper>
          <ScrollAnimationWrapper animation="fade-in-up" delay={160}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact-us" className="rounded-full bg-orange-600 px-7 py-3.5 font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-700">Tư vấn miễn phí</Link>
              <Link href="/service" className="rounded-full border border-orange-200 bg-white px-7 py-3.5 font-bold text-stone-800 transition hover:-translate-y-0.5 hover:bg-orange-50">Quy trình lắp đặt</Link>
            </div>
          </ScrollAnimationWrapper>
          <StaggeredScrollAnimation animation="fade-in-up" staggerDelay={100} className="mt-12 grid grid-cols-3 gap-3">
            {STATISTICS.map((item) => (
              <div key={item.label} className="rounded-3xl border border-orange-100 bg-white/80 p-4 text-center shadow-sm">
                <div className="text-2xl font-black text-[var(--solar-primary-dark)] md:text-3xl">{item.value}</div>
                <div className="mt-1 text-xs font-semibold text-stone-500 md:text-sm">{item.label}</div>
              </div>
            ))}
          </StaggeredScrollAnimation>
        </div>
        <ScrollAnimationWrapper animation="zoom-in" duration={1000}>
          <div className="relative">
            <div className="absolute -left-5 -top-5 h-full w-full rounded-[2rem] border border-orange-300/70" />
            <div className="relative overflow-hidden rounded-[2rem] border-8 border-white bg-white shadow-2xl shadow-orange-950/10">
              <div className="relative aspect-[5/4]">
                <Image src="/images/solar-installation-hero.jpg" alt="Minwy Solar thi công hệ thống điện mặt trời" fill priority sizes="(max-width: 1024px) 100vw, 52vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--solar-primary-dark)]">Khảo sát • Thiết kế • Thi công • Bảo hành</p>
                  <h2 className="mt-2 text-2xl font-bold">Một đội ngũ chịu trách nhiệm xuyên suốt</h2>
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}
