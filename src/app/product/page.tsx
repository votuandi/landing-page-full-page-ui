import { Suspense } from "react";
import ProductCatalog from "@/components/ProductCatalog";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  "Thiết bị điện mặt trời cho nhà xưởng & hệ hybrid",
  "Danh mục tấm pin, inverter, pin lưu trữ và phụ kiện theo thông số kỹ thuật, hãng, công suất và khoảng giá.",
  "/product",
  "/images/solar-inverter-hero.jpg"
);

export default function ProductPage() {
  return <main>
    <section className="t5-page-hero"><div className="t5-container"><span className="t5-eyebrow !text-[var(--t5-accent)]">Thiết bị & báo giá</span><h1 className="t5-page-title">Chọn thiết bị theo thông số. Gom một yêu cầu báo giá cho cả cấu hình.</h1><p className="t5-page-desc">Danh mục ưu tiên dữ liệu kỹ thuật và độ tương thích thay cho nhãn giảm giá hoặc số lượng đã bán.</p></div></section>
    <Suspense fallback={<div className="t5-container py-20 text-slate-500">Đang tải danh mục...</div>}><ProductCatalog /></Suspense>
  </main>;
}