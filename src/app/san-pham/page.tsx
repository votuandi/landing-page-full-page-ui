import { Suspense } from "react";
import ProductCatalog from "@/components/ProductCatalog";
import { notFound } from "next/navigation";
import { makeMetadata } from "@/utils/solar";
import { isDistributor } from "@/config/site";

export const metadata = makeMetadata(
  "Thiết bị solar cho nhà xưởng & hệ hybrid",
  "Catalog tấm pin, inverter, pin lưu trữ và phụ kiện theo thông số kỹ thuật, hãng, công suất và khoảng giá.",
  "/san-pham",
  "/images/solar-inverter-hero.jpg"
);

export default function ProductPage() {
  if (!isDistributor) notFound();
  return <main>
    <section className="t5-page-hero"><div className="t5-container"><span className="t5-eyebrow !text-accent">Sản phẩm</span><h1 className="t5-page-title">Chọn thiết bị theo thông số. Gom một yêu cầu báo giá cho cả cấu hình.</h1><p className="t5-page-desc">Lọc theo tấm pin, inverter, pin lưu trữ và phụ kiện. Chọn nhiều thiết bị để nhận một báo giá chung.</p></div></section>
    <Suspense fallback={<div className="t5-container py-20 text-fg-muted">Đang tải catalog...</div>}><ProductCatalog /></Suspense>
  </main>;
}