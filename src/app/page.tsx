import { Metadata } from "next";
import dynamic from "next/dynamic";
import SliderBanner from "@/components/SliderBanner";
import Hero from "@/components/Hero";
import OurPartners from "@/components/OurPartners";
import { getCachedCompanyInfo } from "@/lib/cachedCompany";
import { prisma } from "@/lib/prisma";
import { NewsArticle } from "@/types";

const ProductSection = dynamic(
  () => import("@/components/ProductSection").then((m) => m.default),
  { ssr: true }
);
const ProjectsSection = dynamic(
  () => import("@/components/ProjectsSection").then((m) => m.default),
  { ssr: true }
);
const NewsSection = dynamic(
  () => import("@/components/NewsSection").then((m) => m.default),
  { ssr: true }
);

export async function generateMetadata(): Promise<Metadata> {
  const companyInfo = await getCachedCompanyInfo();

  const companyName = companyInfo?.companyName || "Trọng Tín Solar";
  const slogan = companyInfo?.slogan || "Hệ thống Năng lượng Mặt trời";
  const description = companyInfo?.mission
    ? `${companyInfo.mission} ${companyInfo.slogan || ""}`.trim()
    : "Chuyên phân phối thiết bị năng lượng mặt trời chất lượng cao. Tấm pin, biến tần inverter, hệ thống lưu trữ năng lượng và giải pháp năng lượng tái tạo.";

  const title = `${companyName} - ${slogan}`;
  const baseUrl = "https://phanphoisolar.com";
  const ogImage = companyInfo?.logoUrl
    ? `${baseUrl}${companyInfo.logoUrl}`
    : `${baseUrl}/og-image.jpg`;

  return {
    title,
    description,
    keywords:
      "năng lượng mặt trời, tấm pin solar, biến tần inverter, pin lưu trữ, solar panel, renewable energy, Trọng Tín Solar",
    authors: [{ name: companyName }],
    creator: companyName,
    publisher: companyName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title,
      description,
      url: baseUrl,
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

async function getHomeData() {
  const [banners, products, projects, news] = await Promise.all([
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      take: 20,
    }),
    prisma.product.findMany({
      where: { showInHomePage: true, isActive: true },
      orderBy: { order: "asc" },
      take: 100,
      include: {
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.project.findMany({
      where: { showInHomepage: true, isDisplay: true },
      orderBy: { order: "asc" },
      take: 100,
    }),
    prisma.news.findMany({
      where: { isActive: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
  ]);
  const slides = banners.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle ?? "",
    description: b.description ?? "",
    buttonText: b.buttonText ?? "",
    buttonLink: b.buttonLink ?? "",
    backgroundImage: b.backgroundImage ? `url('${b.backgroundImage}')` : "",
    backgroundColor: b.backgroundColor ?? "bg-gradient-to-r from-blue-600 to-purple-600",
  }));
  return {
    slides,
    products: products.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    projects: projects.map((p) => ({
      ...p,
      completedDate: p.completedDate,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    news: news.map((n) => ({
      ...n,
      date: n.publishedAt ? new Date(n.publishedAt).toISOString().split("T")[0] : "",
      image: n.imageUrl || "/images/news-placeholder.jpg",
      publishedAt: n.publishedAt ? new Date(n.publishedAt).toISOString() : new Date(n.createdAt).toISOString(),
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
  };
}

export default async function Home() {
  const homeData = await getHomeData();
  return (
    <main className="min-h-screen">
      <SliderBanner initialSlides={homeData.slides} />
      <Hero />
      <OurPartners />
      <ProductSection initialProducts={homeData.products} />
      <ProjectsSection initialProjects={homeData.projects} />
      <NewsSection initialNews={homeData.news as NewsArticle[]} />
    </main>
  );
}
