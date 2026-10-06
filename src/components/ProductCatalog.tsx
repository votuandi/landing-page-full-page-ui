"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CATEGORIES, PRICE_RANGES, PRODUCTS, type Product, type ProductCategory } from "@/data/products";
import { resolvePrice } from "@/lib/price";
import ProductCard from "@/components/ProductCard";

const ProductQuickView = dynamic(() => import("@/components/ProductQuickView"), { ssr: false });

/** Danh sách sản phẩm /san-pham: lọc theo danh mục và khoảng giá (lưu trên URL để chia sẻ được). */
export default function ProductCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [quick, setQuick] = useState<Product | null>(null);

  const category = (search.get("danh-muc") || "") as ProductCategory | "";
  const range = PRICE_RANGES.find((r) => r.value === search.get("gia"));

  const setQuery = (key: string, value: string) => {
    const next = new URLSearchParams(search.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.replace(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  const list = useMemo(() => PRODUCTS.filter((p) => {
    if (category && p.category !== category) return false;
    if (!range) return true;
    const { current } = resolvePrice(p.price, p.salePrice);
    return current !== undefined && current >= range.min && current < range.max;
  }), [category, range]);

  return (
    <section className="t5-section bg-bg" aria-labelledby="catalog-title">
      <div className="t5-container">
        <h2 id="catalog-title" className="sr-only">Danh sách sản phẩm</h2>
        <div className="grid gap-4 border-b border-line/12 pb-6">
          <div>
            <div className="t5-filter-title" id="f-cat">Danh mục</div>
            <div className="t13-no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-labelledby="f-cat">
              <button type="button" aria-pressed={!category} onClick={() => setQuery("danh-muc", "")} className="t13-chip shrink-0">Tất cả</button>
              {CATEGORIES.map((c) => <button key={c.value} type="button" aria-pressed={category === c.value} onClick={() => setQuery("danh-muc", c.value)} className="t13-chip shrink-0">{c.label}</button>)}
            </div>
          </div>
          <div>
            <div className="t5-filter-title" id="f-price">Khoảng giá</div>
            <div className="t13-no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-labelledby="f-price">
              <button type="button" aria-pressed={!range} onClick={() => setQuery("gia", "")} className="t13-chip shrink-0">Mọi mức giá</button>
              {PRICE_RANGES.map((r) => <button key={r.value} type="button" aria-pressed={range?.value === r.value} onClick={() => setQuery("gia", r.value)} className="t13-chip shrink-0">{r.label}</button>)}
            </div>
          </div>
        </div>

        <p className="mt-6 text-sm text-fg-muted" aria-live="polite"><strong className="text-fg">{list.length}</strong> sản phẩm{range ? " (không gồm sản phẩm giá liên hệ)" : ""}</p>
        {list.length ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => <ProductCard key={p.sku} product={p} onQuickView={setQuick} />)}
          </div>
        ) : (
          <div className="t8-card mt-5 p-10 text-center">
            <div className="text-xl font-black text-fg">Không có sản phẩm phù hợp</div>
            <p className="mt-2 text-fg-muted">Thử chọn khoảng giá khác hoặc xem tất cả danh mục.</p>
            <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="t5-button t5-button-primary mt-5">Xóa bộ lọc</button>
          </div>
        )}
      </div>
      {quick && <ProductQuickView product={quick} onClose={() => setQuick(null)} />}
    </section>
  );
}
