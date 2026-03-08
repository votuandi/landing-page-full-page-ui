import type { Metadata } from "next";
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
    title: `Dịch vụ năng lượng mặt trời | ${companyName}`,
    description:
      `${companyName} cung cấp đầy đủ các dịch vụ từ tư vấn, thiết kế, lắp đặt đến bảo trì hệ thống năng lượng mặt trời. Chúng tôi cam kết mang đến giải pháp tối ưu và dịch vụ chất lượng cao nhất.`,
    keywords:
      `dịch vụ năng lượng mặt trời, tư vấn solar, lắp đặt điện mặt trời, bảo trì hệ thống solar, ${companyName}`,
  };
}

export default function ServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
