import { pageMetadata } from "@/utils/seo";
import CompanyStorySection from "@/components/CompanyStorySection";
import IntroductionVideoSection from "@/components/IntroductionVideoSection";
import CompletedProjectsSection from "@/components/CompletedProjectsSection";

export const metadata = pageMetadata(
  "Về Minwy Solar",
  "Tìm hiểu về Minwy Solar và giải pháp năng lượng mặt trời cho gia đình, doanh nghiệp.",
  "/about-us",
);

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
