import { Metadata } from "next";
import NewsPageContent from "@/components/NewsPageContent";
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
    title: `Tin tức năng lượng mặt trời | ${companyName}`,
    description:
      `Cập nhật những tin tức mới nhất về ngành năng lượng mặt trời, chính sách, công nghệ và xu hướng phát triển tại Việt Nam và thế giới từ ${companyName}.`,
    keywords:
      `tin tức năng lượng mặt trời, chính sách điện mặt trời, công nghệ solar, xu hướng năng lượng tái tạo, ${companyName}`,
  };
}

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NewsPageContent />
    </div>
  );
}
