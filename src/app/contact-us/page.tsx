import { pageMetadata } from "@/utils/seo";
import ContactUsContent from "@/components/ContactUsContent";

export const metadata = pageMetadata(
  "Liên hệ tư vấn",
  "Liên hệ Minwy Solar tại Đồng Tháp. Hotline 0708 699 808. Email divt.it97@gmail.com.",
  "/contact-us",
);

export default function ContactUsPage() {
  return (
    <main className="min-h-screen">
      <ContactUsContent />
    </main>
  );
}
