import Image from "next/image";
import Link from "next/link";
import ScrollAnimationWrapper from "./ScrollAnimationWrapper";
import StaggeredScrollAnimation from "./StaggeredScrollAnimation";
import { STATISTICS } from "@/utils/constants";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-yellow-50 py-16 md:py-24">
      <div className="container relative z-10 mx-auto px-4">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <ScrollAnimationWrapper animation="fall-down" delay={120}>
              <p className="mb-4 inline-flex rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-900">
                Năng lượng sạch • Hiệu quả bền vững
              </p>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Giải pháp{" "}
                <span className="bg-gradient-to-r from-primary-700 to-solar-yellow bg-clip-text text-transparent">
                  năng lượng mặt trời
                </span>{" "}
                cho mọi công trình
              </h1>
            </ScrollAnimationWrapper>

            <ScrollAnimationWrapper animation="fade-in-up" delay={240}>
              <p className="mb-8 text-lg leading-relaxed text-slate-600 md:text-xl">
                Tư vấn, cung cấp thiết bị và thi công hệ thống điện mặt trời cho
                gia đình và doanh nghiệp, tối ưu hiệu suất và chi phí vận hành.
              </p>
            </ScrollAnimationWrapper>

            <ScrollAnimationWrapper animation="fade-in-up" delay={320}>
              <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <Link
                  href="/contact-us"
                  className="rounded-lg bg-primary-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-primary-700"
                >
                  Tư vấn miễn phí
                </Link>
                <Link
                  href="/product"
                  className="rounded-lg border-2 border-primary-600 px-8 py-4 text-lg font-semibold text-primary-700 transition hover:bg-green-50"
                >
                  Xem sản phẩm
                </Link>
              </div>
            </ScrollAnimationWrapper>

            <StaggeredScrollAnimation
              animation="fade-in-up"
              staggerDelay={100}
              className="mt-12 grid grid-cols-3 gap-4"
            >
              {STATISTICS.map((item) => (
                <div key={item.label} className="text-center">
                  <div className="mb-1 text-3xl font-bold text-primary-700">
                    {item.value}
                  </div>
                  <div className="text-sm text-slate-600 md:text-base">{item.label}</div>
                </div>
              ))}
            </StaggeredScrollAnimation>
          </div>

          <ScrollAnimationWrapper animation="zoom-in" delay={200}>
            <div className="relative overflow-hidden rounded-3xl border border-green-100 bg-white p-3 shadow-2xl">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src="/images/solar-installation-hero.jpg"
                  alt="Hệ thống điện mặt trời được thi công bởi Minwy Solar"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-sm font-medium text-yellow-300">Giải pháp trọn gói</p>
                  <h2 className="mt-1 text-2xl font-bold">Thiết kế • Thi công • Bảo trì</h2>
                </div>
              </div>
            </div>
          </ScrollAnimationWrapper>
        </div>
      </div>
    </section>
  );
}
