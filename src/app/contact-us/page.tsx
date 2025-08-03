import type { Metadata } from "next";
import ContactUsContent from "@/components/ContactUsContent";

export const metadata: Metadata = {
  title: "Liên hệ - Tâm Huỳnh Solar",
  description:
    "Liên hệ với Tâm Huỳnh Solar để được tư vấn miễn phí về các giải pháp năng lượng mặt trời. Địa chỉ: Lấp Vò, Đồng Tháp. Hotline: 0909019234",
  keywords:
    "liên hệ, tâm huỳnh solar, tư vấn năng lượng mặt trời, lấp vò đồng tháp, solar consultation",
};

export default function ContactUsPage() {
  return (
    <main className="min-h-screen">
      <ContactUsContent />
    </main>
  );
}
