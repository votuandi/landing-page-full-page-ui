import { Metadata } from "next";
import NewsPageContent from "@/components/NewsPageContent";

export const metadata: Metadata = {
  title: "Tin tức năng lượng mặt trời | Tâm Huỳnh Solar",
  description:
    "Cập nhật những tin tức mới nhất về ngành năng lượng mặt trời, chính sách, công nghệ và xu hướng phát triển tại Việt Nam và thế giới.",
  keywords:
    "tin tức năng lượng mặt trời, chính sách điện mặt trời, công nghệ solar, xu hướng năng lượng tái tạo",
};

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NewsPageContent />
    </div>
  );
}
