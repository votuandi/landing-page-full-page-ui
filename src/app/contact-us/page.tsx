import type { Metadata } from "next";
import ContactUsContent from "@/components/ContactUsContent";
import { prisma } from "@/lib/prisma";

async function getContactInfo() {
  try {
    const [companyInfo, mainOffice] = await Promise.all([
      prisma.companyInfo.findUnique({ where: { id: 1 } }),
      prisma.office.findFirst({ where: { isMainOffice: true } }),
    ]);
    return { companyInfo, mainOffice };
  } catch (error) {
    console.error("Error fetching contact info for metadata:", error);
    return { companyInfo: null, mainOffice: null };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { companyInfo, mainOffice } = await getContactInfo();

  const companyName = companyInfo?.companyName || "Trọng Tín Solar";
  const address = mainOffice?.address || "Lấp Vò, Đồng Tháp";
  const phone = mainOffice?.phone || "0909019234";
  const email = mainOffice?.email || "";

  const description = `Liên hệ với ${companyName} để được tư vấn miễn phí về các giải pháp năng lượng mặt trời. ${address ? `Địa chỉ: ${address}.` : ""} ${phone ? `Hotline: ${phone}` : ""}`.trim();

  return {
    title: `Liên hệ - ${companyName}`,
    description,
    keywords:
      `liên hệ, ${companyName}, tư vấn năng lượng mặt trời, ${address}, solar consultation`,
  };
}

export default function ContactUsPage() {
  return (
    <main className="min-h-screen">
      <ContactUsContent />
    </main>
  );
}
