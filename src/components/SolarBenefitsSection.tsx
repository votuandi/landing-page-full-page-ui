"use client";

import Image from "next/image";
import {
  BanknotesIcon,
  BoltIcon,
  HomeModernIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

const benefits = [
  {
    icon: BanknotesIcon,
    title: "Giảm chi phí điện mỗi tháng",
    description:
      "Tận dụng nguồn nắng miễn phí để chủ động tạo điện, giảm áp lực hóa đơn và tối ưu chi phí vận hành dài hạn.",
  },
  {
    icon: BoltIcon,
    title: "Chủ động nguồn năng lượng",
    description:
      "Hệ thống được thiết kế theo nhu cầu thực tế, giúp gia đình và doanh nghiệp giảm phụ thuộc vào điện lưới.",
  },
  {
    icon: HomeModernIcon,
    title: "Tăng giá trị công trình",
    description:
      "Một hệ thống solar hoàn thiện tốt vừa nâng cấp trải nghiệm sử dụng, vừa tạo thêm giá trị cho nhà ở và tài sản.",
  },
  {
    icon: SunIcon,
    title: "Đầu tư bền vững",
    description:
      "Điện mặt trời có vòng đời dài, chi phí bảo trì thấp và góp phần giảm phát thải trong suốt thời gian vận hành.",
  },
];

export default function SolarBenefitsSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--solar-white)] py-20 md:py-28">
      <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <ScrollAnimationWrapper animation="slide-in-left" duration={900}>
            <div>
              <span className="inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">
                Lợi ích năng lượng mặt trời
              </span>
              <h2 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-stone-900 md:text-5xl">
                Biến mái nhà thành một nguồn năng lượng có giá trị mỗi ngày
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
                Một hệ thống solar phù hợp không chỉ giúp tiết kiệm điện mà còn
                tạo ra lợi ích dài hạn cho tài chính, vận hành và giá trị công trình.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <ScrollAnimationWrapper
                      key={benefit.title}
                      animation="fade-in-up"
                      delay={index * 120}
                      duration={700}
                      className="h-full"
                    >
                      <div className="h-full rounded-3xl border border-orange-100 bg-white p-6 shadow-[0_18px_50px_color-mix(in srgb,var(--solar-primary-dark) 8%,transparent)] transition duration-300 hover:-translate-y-1 hover:border-orange-200">
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-lg shadow-orange-200">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-stone-900">
                          {benefit.title}
                        </h3>
                        <p className="mt-3 leading-7 text-stone-600">
                          {benefit.description}
                        </p>
                      </div>
                    </ScrollAnimationWrapper>
                  );
                })}
              </div>
            </div>
          </ScrollAnimationWrapper>

          <ScrollAnimationWrapper animation="zoom-in" duration={1000}>
            <div className="relative">
              <div className="absolute -left-5 -top-5 h-full w-full rounded-[2rem] border border-orange-200" />
              <div className="relative overflow-hidden rounded-[2rem] bg-white p-3 shadow-2xl shadow-orange-950/10">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
                  <Image
                    src="/images/solar-panels-hero.jpg"
                    alt="Hệ thống pin năng lượng mặt trời trên mái nhà"
                    fill
                    className="object-cover transition duration-700 hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 45vw"
                  />
                  <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/40 bg-white/90 p-5 backdrop-blur">
                    <div className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-700">
                      Năng lượng sạch • hiệu quả dài hạn
                    </div>
                    <p className="mt-2 text-lg font-bold text-stone-900">
                      Thiết kế đúng ngay từ đầu giúp hệ thống vận hành ổn định
                      trong nhiều năm.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimationWrapper>
        </div>
      </div>
    </section>
  );
}
