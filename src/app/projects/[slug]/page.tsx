import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectDetailContent from "@/components/ProjectDetailContent";

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

// Fetch project from API
async function getProject(id: string): Promise<Project | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/projects/${id}`, {
      cache: 'no-store', // Always fetch fresh data
    });
    
    if (!response.ok) {
      return null;
    }
    
    const project = await response.json();
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
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

  return {
    title: `${project.title} | ${companyName}`,
    description: project.description || `Dự án năng lượng mặt trời ${project.title} tại ${project.location || 'Việt Nam'}`,
    keywords: `${project.title}, ${project.category}, năng lượng mặt trời, dự án solar, ${project.location || ''}, ${companyName}`,
    openGraph: {
      title: project.title,
      description: project.description || '',
      images: [project.imageUrl || ''],
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectDetailContent project={project} />
    </div>
  );
}
