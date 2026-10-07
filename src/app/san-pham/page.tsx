import { Suspense } from "react";
import { notFound } from "next/navigation";
import { catalogEnabled } from "@/config/site";
import { makeMetadata } from "@/utils/solar";
import { Tr } from "@/i18n/LangProvider";
import ProductCatalog, { CatalogFallback } from "@/components/ProductCatalog";

export const metadata = makeMetadata(
  "Thiết bị & sản phẩm năng lượng mặt trời",
  "Tấm pin, inverter, pin lưu trữ, All-in-one, BESS, đèn năng lượng mặt trời và phụ kiện chính hãng. Lọc theo hãng, công nghệ, công suất, khoảng giá — gửi một yêu cầu báo giá chung.",
  "/san-pham",
);

export default function ProductsPage() {
  if (!catalogEnabled) notFound();
  return <main>
    <section className="t15-page-hero !py-12 md:!py-16">
      <div className="t15-container">
        <span className="t15-eyebrow"><Tr vi="Sản phẩm" en="Products" /></span>
        <h1 className="t15-page-title"><Tr vi="Thiết bị chính hãng — gom một yêu cầu báo giá cho cả cấu hình." en="Genuine equipment — one quote request for your whole system." /></h1>
        <p className="t15-page-desc"><Tr vi="Lọc theo loại thiết bị, hãng, công nghệ, công suất và khoảng giá. Thêm vào giỏ yêu cầu báo giá — không thanh toán online, chúng tôi gọi lại báo giá và tư vấn lắp đặt." en="Filter by type, brand, technology, power and price. Add to the quote cart — no online payment; we call back with prices and installation advice." /></p>
      </div>
    </section>
    <Suspense fallback={<CatalogFallback />}><ProductCatalog /></Suspense>
  </main>;
}
