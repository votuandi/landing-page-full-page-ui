import type { Metadata } from "next";
import WarmPageHero from "@/components/WarmPageHero";
import CompanyStorySection from "@/components/CompanyStorySection";
import IntroductionVideoSection from "@/components/IntroductionVideoSection";
import CompletedProjectsSection from "@/components/CompletedProjectsSection";

export const metadata: Metadata = {
  title: "Về chúng tôi - Minwy Solar",
  description: "Tìm hiểu đội ngũ, chuyên môn và cam kết dài hạn của Minwy Solar trong lĩnh vực năng lượng mặt trời.",
};

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-[#fffaf0]">
      <WarmPageHero
        eyebrow="Về Minwy Solar"
        title="Làm năng lượng mặt trời bằng chuyên môn và trách nhiệm dài hạn"
        description="Chúng tôi bắt đầu từ bài toán thực tế của từng công trình, thiết kế đúng nhu cầu, thi công kỹ và tiếp tục đồng hành trong suốt vòng đời hệ thống."
        image="/images/our_story.webp"
        primaryLabel="Trao đổi với chuyên gia"
        primaryHref="/contact-us"
        secondaryLabel="Xem dịch vụ"
        secondaryHref="/service"
      />
      <section className="border-y border-orange-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            ["10+ năm", "Kinh nghiệm triển khai và tối ưu giải pháp solar"],
            ["1000+", "Công trình gia đình và doanh nghiệp đã đồng hành"],
            ["Dài hạn", "Bảo hành, bảo trì và hỗ trợ sau bàn giao"],
          ].map(([value, label]) => (
            <div key={value} className="rounded-3xl bg-[#fff8ed] p-6 text-center">
              <div className="text-3xl font-black text-orange-600">{value}</div>
              <p className="mt-2 text-sm leading-6 text-stone-600">{label}</p>
            </div>
          ))}
        </div>
      </section>
      <CompanyStorySection />
      <IntroductionVideoSection />
      <CompletedProjectsSection />
    </main>
  );
}
