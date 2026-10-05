import type { Metadata } from "next";
import CompanyStorySection from "@/components/CompanyStorySection";
import IntroductionVideoSection from "@/components/IntroductionVideoSection";
import CompletedProjectsSection from "@/components/CompletedProjectsSection";
import { getCachedCompanyInfo } from "@/lib/cachedCompany";
import WarmPageHero from "@/components/WarmPageHero";

export async function generateMetadata(): Promise<Metadata> {
  const companyInfo = await getCachedCompanyInfo();

  const companyName = companyInfo?.companyName || "Trọng Tín Solar";
  const storyTitle = companyInfo?.storyTitle || "Câu chuyện công ty";
  const mission = companyInfo?.mission || "";

  const description = mission
    ? `Tìm hiểu về ${storyTitle.toLowerCase()} và sứ mệnh của ${companyName} - đơn vị hàng đầu về năng lượng mặt trời tại Việt Nam. ${mission}`
    : `Tìm hiểu về ${storyTitle.toLowerCase()} và các dự án đã hoàn thành của ${companyName} - đơn vị hàng đầu về năng lượng mặt trời tại Việt Nam.`;

  const title = `Về chúng tôi - ${companyName}`;
  const baseUrl = "https://phanphoisolar.com";
  const ogImage = companyInfo?.logoUrl
    ? `${baseUrl}${companyInfo.logoUrl}`
    : `${baseUrl}/og-image.jpg`;

  return {
    title,
    description,
    keywords:
      `về chúng tôi, ${companyName}, năng lượng mặt trời, dự án hoàn thành, câu chuyện công ty`,
    authors: [{ name: companyName }],
    creator: companyName,
    publisher: companyName,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: "/about-us",
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/about-us`,
      siteName: companyName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.substring(0, 200),
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-[#fffaf0]">
      <WarmPageHero
        eyebrow="Về chúng tôi"
        title="Một đội ngũ làm solar với tư duy dài hạn"
        description="Chúng tôi theo đuổi cách làm bài bản: hiểu nhu cầu thật, thiết kế đúng, thi công kỹ và tiếp tục đồng hành sau khi hệ thống được đưa vào vận hành."
        image="/images/our_story.webp"
        primaryLabel="Trao đổi với chúng tôi"
        primaryHref="/contact-us"
        secondaryLabel="Xem dự án"
        secondaryHref="/projects"
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["Hiểu bài toán trước khi bán", "Tập trung vào nhu cầu tiêu thụ, ngân sách và điều kiện công trình thay vì áp một cấu hình có sẵn."],
            ["Kỹ thuật là nền tảng", "Ưu tiên an toàn, khả năng bảo trì và hiệu suất thực tế trong mọi quyết định thiết kế."],
            ["Đồng hành sau bàn giao", "Bảo hành, hỗ trợ và theo dõi vận hành là một phần của dịch vụ, không phải phần việc tách rời."],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold text-stone-900">{title}</h2>
              <p className="mt-3 leading-7 text-stone-600">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Company Story Section */}
      <CompanyStorySection />

      {/* Introduction Video Section */}
      <IntroductionVideoSection />

      {/* Completed Projects Section */}
      <CompletedProjectsSection />
    </main>
  );
}
