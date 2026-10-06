"use client";

import Image from "next/image";
import {
  CheckBadgeIcon,
  ClockIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

const strengths = [
  {
    icon: CheckBadgeIcon,
    title: "Khảo sát & thiết kế bài bản",
    description:
      "Đánh giá mái, hướng nắng, tải tiêu thụ và điều kiện thi công trước khi đề xuất cấu hình phù hợp.",
  },
  {
    icon: WrenchScrewdriverIcon,
    title: "Thi công gọn và an toàn",
    description:
      "Quy trình lắp đặt rõ ràng, chú trọng thẩm mỹ, chống thấm, kết cấu và an toàn điện.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Bảo hành dài hạn",
    description:
      "Chính sách bảo hành minh bạch, hỗ trợ kỹ thuật và đồng hành trong suốt vòng đời hệ thống.",
  },
  {
    icon: ClockIcon,
    title: "Phản hồi nhanh sau lắp đặt",
    description:
      "Tiếp nhận yêu cầu, kiểm tra tình trạng và xử lý sự cố theo quy trình để hạn chế thời gian gián đoạn.",
  },
];

export default function SolarExpertiseSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--solar-primary-dark)] py-20 text-white md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in srgb,var(--solar-accent) 22%,transparent),transparent_36%),radial-gradient(circle_at_bottom_left,color-mix(in srgb,var(--solar-accent) 18%,transparent),transparent_32%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <ScrollAnimationWrapper animation="slide-in-left" duration={900}>
            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-3 shadow-2xl">
                <div className="relative aspect-[5/4] overflow-hidden rounded-[1.5rem]">
                  <Image
                    src="/images/solar-installation-hero.jpg"
                    alt="Đội ngũ kỹ thuật thi công hệ thống điện mặt trời"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-2 max-w-xs rounded-3xl bg-[var(--solar-surface)] p-6 text-stone-900 shadow-2xl md:-right-6">
                <div className="text-3xl font-black text-[var(--solar-primary-dark)]">Bền bỉ từ thiết kế</div>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Chọn thiết bị đúng, lắp đặt chuẩn và bảo hành rõ ràng là nền tảng
                  để hệ thống solar hoạt động ổn định lâu dài.
                </p>
              </div>
            </div>
          </ScrollAnimationWrapper>

          <div>
            <ScrollAnimationWrapper animation="fade-in-up" duration={800}>
              <span className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--solar-primary-dark)]">
                Chuyên môn & cam kết
              </span>
              <h2 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
                Không chỉ lắp pin — chúng tôi xây một hệ thống để vận hành lâu dài
              </h2>
              <p className="mt-5 text-lg leading-8 text-stone-300">
                Từ khảo sát đến bảo hành, mỗi bước đều được thiết kế để giảm rủi ro,
                tối ưu hiệu suất và giúp khách hàng an tâm trong quá trình sử dụng.
              </p>
            </ScrollAnimationWrapper>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {strengths.map((item, index) => {
                const Icon = item.icon;
                return (
                  <ScrollAnimationWrapper
                    key={item.title}
                    animation="fade-in-up"
                    delay={index * 120}
                    duration={700}
                    className="h-full"
                  >
                    <div className="h-full rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/[0.09]">
                      <Icon className="h-8 w-8 text-[var(--solar-primary-dark)]" />
                      <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
                      <p className="mt-3 leading-7 text-stone-300">{item.description}</p>
                    </div>
                  </ScrollAnimationWrapper>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
