"use client";

import { CarouselNav, SectionHead, useSnapCarousel } from "@solar/ui";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { featuredProducts, type Product } from "@/data/products";
import { SECTION_IDS } from "@solar/core";
import { useLang } from "@/i18n/LangProvider";
import ProductCard from "@/components/ProductCard";

const ProductQuickView = dynamic(() => import("@/components/ProductQuickView"), { ssr: false });
const ITEMS = featuredProducts(8);

/** Dải sản phẩm trang chủ: tối đa 8 sản phẩm nổi bật, carousel nhỏ + "Xem tất cả". Không phải lưới kệ hàng. */
export default function ProductStrip() {
  const { tr } = useLang();
  const [quick, setQuick] = useState<Product | null>(null);
  const c = useSnapCarousel();
  if (!ITEMS.length) return null;

  return (
    <section id={SECTION_IDS.products} className="t15-section relative overflow-hidden bg-bg-elevated" aria-labelledby="products-title">
      <div className="t15-container">
        <SectionHead id="products-title" eyebrow={tr("Cửa hàng thiết bị", "Equipment store")}
          title={tr("Thiết bị & sản phẩm năng lượng mặt trời chính hãng.", "Genuine solar equipment & products.")}
          desc={tr("Thêm vào giỏ yêu cầu báo giá — không thanh toán online, chúng tôi gọi lại báo giá và tư vấn lắp đặt.", "Add to the quote cart — no online payment, we call back with prices and installation advice.")}
          action={<div className="flex items-center gap-2">
            <CarouselNav prevLabel={tr("Trước", "Previous")} nextLabel={tr("Tiếp", "Next")} prev={c.prev} next={c.next} atStart={c.atStart} atEnd={c.atEnd} className="hidden lg:flex" />
            <Link href="/san-pham" className="t15-button t15-button-secondary">{tr("Xem tất cả", "View all")} <ArrowRightIcon className="h-4 w-4" /></Link>
          </div>} />
        <div ref={c.ref} className="t15-no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0" aria-label={tr("Sản phẩm nổi bật", "Featured products")}>
          {ITEMS.map((p) => (
            <div key={p.slug} className="w-[calc((100%-0.75rem)/1.6)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]">
              <ProductCard product={p} onQuickView={setQuick} compact />
            </div>
          ))}
        </div>
      </div>
      {quick && <ProductQuickView product={quick} onClose={() => setQuick(null)} />}
    </section>
  );
}
