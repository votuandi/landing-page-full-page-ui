import { Metadata } from "next";
import ProjectsPageContent from "@/components/ProjectsPageContent";

export const metadata: Metadata = {
  title: "Dự án năng lượng mặt trời | Trọng Tín Solar",
  description:
    "Khám phá các dự án năng lượng mặt trời đã hoàn thành của Trọng Tín Solar. Từ hệ thống công nghiệp đến dân dụng, chúng tôi mang đến giải pháp năng lượng xanh cho mọi nhu cầu.",
  keywords:
    "dự án năng lượng mặt trời, dự án solar, hệ thống điện mặt trời, dự án hoàn thành, năng lượng xanh",
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectsPageContent />
    </div>
  );
}
