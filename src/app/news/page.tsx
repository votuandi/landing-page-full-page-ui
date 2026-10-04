import { pageMetadata } from "@/utils/seo";
import NewsPageContent from "@/components/NewsPageContent";

export const metadata = pageMetadata(
  "Tin tức năng lượng mặt trời",
  "Kiến thức, công nghệ và giải pháp sử dụng năng lượng mặt trời.",
  "/news",
);

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NewsPageContent />
    </div>
  );
}
