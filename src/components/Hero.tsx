"use client";

import { useEffect } from "react";
import Link from "next/link";
import ScrollAnimationWrapper from "./ScrollAnimationWrapper";
import StaggeredScrollAnimation from "./StaggeredScrollAnimation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchHeroContent } from "@/lib/features/introduction/introductionSlice";

export default function Hero() {
  const dispatch = useAppDispatch();
  const { data: heroContent, loading } = useAppSelector((state) => state.introduction);

  useEffect(() => {
    dispatch(fetchHeroContent());
  }, [dispatch]);

  if (loading) {
    return (
      <section className="bg-[#fffaf0] py-24">
        <div className="mx-auto flex max-w-7xl justify-center px-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-100 border-t-orange-600" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#fffaf0] py-20 md:py-28">
      <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <ScrollAnimationWrapper animation="fade-in-up" duration={800}>
              <span className="inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-700">
                Năng lượng sạch cho tương lai
              </span>
              <h1 className="mt-6 text-4xl font-black leading-[1.06] tracking-tight text-stone-900 md:text-6xl">
                {heroContent.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 md:text-xl">
                {heroContent.description}
              </p>
            </ScrollAnimationWrapper>

            <ScrollAnimationWrapper animation="fade-in-up" delay={160} duration={800}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/contact-us"
                  className="rounded-full bg-orange-600 px-7 py-3.5 font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-700"
                >
                  Tư vấn miễn phí
                </Link>
                <Link
                  href="/product"
                  className="rounded-full border border-orange-200 bg-white px-7 py-3.5 font-bold text-stone-800 transition hover:-translate-y-0.5 hover:bg-orange-50"
                >
                  Xem sản phẩm
                </Link>
              </div>
            </ScrollAnimationWrapper>

            <StaggeredScrollAnimation
              animation="fade-in-up"
              staggerDelay={120}
              className="mt-12 grid grid-cols-3 gap-3"
            >
              {[
                [heroContent.stat1Value, heroContent.stat1Label],
                [heroContent.stat2Value, heroContent.stat2Label],
                [heroContent.stat3Value, heroContent.stat3Label],
              ].map(([value, label]) => (
                <div key={label} className="rounded-3xl border border-orange-100 bg-white/80 p-4 text-center shadow-sm backdrop-blur">
                  <div className="text-2xl font-black text-orange-600 md:text-3xl">{value}</div>
                  <div className="mt-1 text-xs font-semibold text-stone-500 md:text-sm">{label}</div>
                </div>
              ))}
            </StaggeredScrollAnimation>
          </div>

          <ScrollAnimationWrapper animation="zoom-in" duration={1000}>
            <div className="relative">
              <div className="absolute -left-6 -top-6 h-full w-full rounded-[2rem] border border-orange-200" />
              <div className="relative overflow-hidden rounded-[2rem] border-8 border-white bg-white shadow-2xl shadow-orange-950/10">
                <div className="relative aspect-[5/4] overflow-hidden bg-stone-900">
                  <video
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src={heroContent.videoUrl} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                    <div className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300">
                      Thiết kế • Lắp đặt • Bảo hành
                    </div>
                    <h2 className="mt-2 text-2xl font-bold">Một hệ thống được tính cho nhiều năm vận hành</h2>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-2 max-w-[260px] rounded-3xl bg-amber-300 p-5 text-stone-900 shadow-xl md:-right-6">
                <div className="font-black">{heroContent.feature1Title}</div>
                <p className="mt-1 text-sm leading-6 text-stone-700">{heroContent.feature1Description}</p>
              </div>
            </div>
          </ScrollAnimationWrapper>
        </div>
      </div>
    </section>
  );
}
