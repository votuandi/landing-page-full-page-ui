"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  image: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    title: "TẤM PIN HIỆU SUẤT CAO",
    subtitle: "Tối ưu sản lượng điện mỗi ngày",
    description: "Giải pháp tấm pin chất lượng cao, phù hợp cho nhà ở và doanh nghiệp.",
    buttonText: "Xem sản phẩm",
    buttonLink: "/product",
    image: "/images/solar-panels-hero.jpg",
  },
  {
    id: 2,
    title: "BIẾN TẦN THÔNG MINH",
    subtitle: "Vận hành ổn định, giám sát thuận tiện",
    description: "Thiết bị inverter đáp ứng nhiều quy mô hệ thống và nhu cầu sử dụng.",
    buttonText: "Khám phá sản phẩm",
    buttonLink: "/product",
    image: "/images/solar-inverter-hero.jpg",
  },
  {
    id: 3,
    title: "THI CÔNG TRỌN GÓI",
    subtitle: "Từ khảo sát đến vận hành hệ thống",
    description: "Đội ngũ kỹ thuật đồng hành từ tư vấn, thiết kế, thi công đến bảo trì.",
    buttonText: "Xem dịch vụ",
    buttonLink: "/service",
    image: "/images/solar-installation-hero.jpg",
  },
];

export default function SliderBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideCount = useMemo(() => SLIDES.length, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setCurrentSlide((previous) => (previous + 1) % slideCount);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [slideCount]);

  return (
    <section className="relative isolate min-h-[72vh] overflow-hidden bg-primary-900">
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={[
            "absolute inset-0 transition-opacity duration-700",
            index === currentSlide ? "z-10 opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
          aria-hidden={index !== currentSlide}
        >
          <Image
            src={slide.image}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950/85 via-green-900/65 to-slate-950/35" />
          <div className="container relative mx-auto flex min-h-[72vh] items-center px-4 py-20">
            <div className="max-w-3xl text-white">
              <p className="mb-4 font-semibold tracking-[0.2em] text-yellow-300">{slide.title}</p>
              <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">{slide.subtitle}</h2>
              <p className="mb-8 max-w-2xl text-lg text-green-50 md:text-xl">{slide.description}</p>
              <div className="flex flex-wrap gap-4">
                <Link href={slide.buttonLink} className="rounded-lg bg-yellow-400 px-7 py-3 font-semibold text-slate-900 transition hover:bg-yellow-300">
                  {slide.buttonText}
                </Link>
                <a href="tel:0909019234" className="rounded-lg border border-white/60 px-7 py-3 font-semibold text-white transition hover:bg-white/10">
                  Gọi 0909019234
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="container relative z-20 mx-auto flex min-h-[72vh] items-end justify-center px-4 pb-8">
        <div className="flex gap-2" role="tablist" aria-label="Banner trang chủ">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentSlide(index)}
              className={index === currentSlide ? "h-2 w-10 rounded-full bg-yellow-400" : "h-2 w-6 rounded-full bg-white/50"}
              aria-label={`Hiển thị banner ${index + 1}`}
              aria-selected={index === currentSlide}
              role="tab"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
