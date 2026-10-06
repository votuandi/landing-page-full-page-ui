import { notFound } from "next/navigation";
import { catalogEnabled } from "@/config/site";
import ProductCatalog from "@/components/ProductCatalog";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  "Sản phẩm năng lượng mặt trời",
  "Tấm pin, inverter, pin lưu trữ, đèn năng lượng mặt trời và phụ kiện chính hãng. Chọn sản phẩm và gửi một yêu cầu báo giá chung.",
  "/san-pham",
);

export default function ProductsPage() {
  if (!catalogEnabled) notFound();
  return <main>
    <section className="t5-page-hero !py-12 md:!py-16">
      <div className="t5-container">
        <span className="t5-eyebrow !border-on-media/20 !bg-on-media/10 !text-highlight">Sản phẩm</span>
        <h1 className="t5-page-title">Thiết bị & đèn năng lượng mặt trời chính hãng.</h1>
        <p className="t5-page-desc">Chọn sản phẩm cần mua, thêm vào giỏ yêu cầu báo giá — không cần thanh toán online, chúng tôi gọi lại báo giá và tư vấn lắp đặt.</p>
      </div>
    </section>
    <ProductCatalog />
  </main>;
}
