"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { featuredProducts, type Product } from "@/data/products";
import { SECTION_IDS } from "@/lib/segment";
import ProductCard from "@/components/ProductCard";

const ProductQuickView = dynamic(() => import("@/components/ProductQuickView"), { ssr: false });

const ITEMS = featuredProducts(8);
const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Dải sản phẩm trang chủ: tối đa 8 sản phẩm nổi bật, carousel nhỏ + "Xem tất cả". Không phải lưới kệ hàng. */
export default function ProductStrip() {
  const [quick, setQuick] = useState<Product | null>(null);
  const track = useRef<HTMLDivElement>(null);
  if (!ITEMS.length) return null;

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: prefersReduced() ? "auto" : "smooth" });
  };

  return (
    <section id={SECTION_IDS.products} className="t5-section bg-bg-elevated" aria-labelledby="products-title">
      <div className="t5-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div data-reveal="down">
            <span className="t5-eyebrow">Cửa hàng thiết bị</span>
            <h2 id="products-title" className="mt-4 text-3xl font-black tracking-[-.04em] text-fg sm:text-4xl">Thiết bị & sản phẩm năng lượng mặt trời</h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => scroll(-1)} aria-label="Sản phẩm trước" className="t8-glass hidden h-11 w-11 place-items-center rounded-full text-fg lg:grid"><ChevronLeftIcon className="h-5 w-5" /></button>
            <button type="button" onClick={() => scroll(1)} aria-label="Sản phẩm tiếp theo" className="t8-glass hidden h-11 w-11 place-items-center rounded-full text-fg lg:grid"><ChevronRightIcon className="h-5 w-5" /></button>
            <Link href="/san-pham" className="t5-button t5-button-secondary">Xem tất cả <ArrowRightIcon className="h-4 w-4" /></Link>
          </div>
        </div>
        <div ref={track} className="t13-no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0" aria-label="Sản phẩm nổi bật">
          {ITEMS.map((p) => (
            <div key={p.sku} className="w-[calc((100%-0.75rem)/1.6)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]">
              <ProductCard product={p} onQuickView={setQuick} compact />
            </div>
          ))}
        </div>
      </div>
      {quick && <ProductQuickView product={quick} onClose={() => setQuick(null)} />}
    </section>
  );
}
