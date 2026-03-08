import type { Metadata } from "next";
import CompanyStorySection from "@/components/CompanyStorySection";
import IntroductionVideoSection from "@/components/IntroductionVideoSection";
import CompletedProjectsSection from "@/components/CompletedProjectsSection";
import { prisma } from "@/lib/prisma";

async function getCompanyInfo() {
  try {
    const companyInfo = await prisma.companyInfo.findUnique({
      where: { id: 1 },
    });
    return companyInfo;
  } catch (error) {
    console.error("Error fetching company info for metadata:", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const companyInfo = await getCompanyInfo();
  
  const companyName = companyInfo?.companyName || "Trọng Tín Solar";
  const storyTitle = companyInfo?.storyTitle || "Câu chuyện công ty";
  const mission = companyInfo?.mission || "";
  
  const description = mission 
    ? `Tìm hiểu về ${storyTitle.toLowerCase()} và sứ mệnh của ${companyName} - đơn vị hàng đầu về năng lượng mặt trời tại Việt Nam. ${mission}`
    : `Tìm hiểu về ${storyTitle.toLowerCase()} và các dự án đã hoàn thành của ${companyName} - đơn vị hàng đầu về năng lượng mặt trời tại Việt Nam.`;
  
  return {
    title: `Về chúng tôi - ${companyName}`,
    description,
    keywords:
      `về chúng tôi, ${companyName}, năng lượng mặt trời, dự án hoàn thành, câu chuyện công ty`,
  };
}

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
