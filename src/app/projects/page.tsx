import { Metadata } from "next";
import ProjectsPageContent from "@/components/ProjectsPageContent";
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
  
  return {
    title: `Dự án năng lượng mặt trời | ${companyName}`,
    description:
      `Khám phá các dự án năng lượng mặt trời đã hoàn thành của ${companyName}. Từ hệ thống công nghiệp đến dân dụng, chúng tôi mang đến giải pháp năng lượng xanh cho mọi nhu cầu.`,
    keywords:
      `dự án năng lượng mặt trời, dự án solar, hệ thống điện mặt trời, dự án hoàn thành, năng lượng xanh, ${companyName}`,
  };
}

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectsPageContent />
    </div>
  );
}
