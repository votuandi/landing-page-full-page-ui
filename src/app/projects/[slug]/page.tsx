import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectDetailContent from "@/components/ProjectDetailContent";
import StructuredData from "@/components/StructuredData";

interface Project {
  id: number;
  title: string;
  location: string | null;
  capacity: string | null;
  completedDate: string | null;
  imageUrl: string | null;
  description: string | null;
  detail: string | null;
  category: string;
  client: string | null;
}

// Fetch project directly from database
async function getProject(id: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!project) {
      return null;
    }
    
    return project;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

interface Props {
  params: Promise<{ slug: string }>;
}

import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // Revalidate every hour (ISR)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = "https://phanphoisolar.com";
  const [project, companyInfo] = await Promise.all([
    getProject(slug),
    prisma.companyInfo.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  const companyName = companyInfo?.companyName || "Trọng Tín Solar";

  if (!project) {
    return {
      title: `Dự án không tồn tại | ${companyName}`,
    };
  }

  const description = project.description || 
    `Dự án năng lượng mặt trời ${project.title} tại ${project.location || 'Việt Nam'}`;
  const ogImage = project.imageUrl
    ? `${baseUrl}${project.imageUrl}`
    : `${baseUrl}/images/project-placeholder.jpg`;

  return {
    title: `${project.title} | ${companyName}`,
    description: description.substring(0, 160),
    keywords: `${project.title}, ${project.category}, năng lượng mặt trời, dự án solar, ${project.location || ''}, ${companyName}`,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/projects/${project.id}`,
    },
    openGraph: {
      title: `${project.title} | ${companyName}`,
      description: description.substring(0, 160),
      url: `${baseUrl}/projects/${project.id}`,
      siteName: companyName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | ${companyName}`,
      description: description.substring(0, 200),
      images: [ogImage],
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const [project, companyInfo] = await Promise.all([
    getProject(slug),
    prisma.companyInfo.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  if (!project) {
    notFound();
  }

  // Use the project we already fetched for structured data
  const fullProject = project;

  // Breadcrumb data
  const breadcrumbs = [
    { name: "Trang chủ", url: "/" },
    { name: "Dự án", url: "/projects" },
    { name: project.title, url: `/projects/${project.id}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {fullProject && (
        <StructuredData type="Project" data={fullProject} companyInfo={companyInfo} />
      )}
      <StructuredData type="BreadcrumbList" data={breadcrumbs} />
      <ProjectDetailContent project={project} />
    </div>
  );
}
