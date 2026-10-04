import ServicePageContent from "@/components/ServicePageContent";
import { pageMetadata } from "@/utils/seo";
export const metadata = pageMetadata(
  "Giải pháp điện mặt trời",
  "Tư vấn, thiết kế, lắp đặt và bảo trì hệ thống điện mặt trời cho gia đình và doanh nghiệp.",
  "/service",
);
export default function ServicePage() {
  return <ServicePageContent />;
}
