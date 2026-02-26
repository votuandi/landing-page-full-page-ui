import type { Metadata } from "next";
import CompanyStorySection from "@/components/CompanyStorySection";
import IntroductionVideoSection from "@/components/IntroductionVideoSection";
import CompletedProjectsSection from "@/components/CompletedProjectsSection";

export const metadata: Metadata = {
  title: "Về chúng tôi - Trọng Tín Solar",
  description:
    "Tìm hiểu về câu chuyện, sứ mệnh và các dự án đã hoàn thành của Trọng Tín Solar - đơn vị hàng đầu về năng lượng mặt trời tại Việt Nam.",
  keywords:
    "về chúng tôi, Trọng Tín solar, năng lượng mặt trời, dự án hoàn thành, câu chuyện công ty",
};

export default function AboutUsPage() {
  return (
    <main className="min-h-screen">
      {/* Company Story Section */}
      <CompanyStorySection />

      {/* Introduction Video Section */}
      <IntroductionVideoSection />

      {/* Completed Projects Section */}
      <CompletedProjectsSection />
    </main>
  );
}
