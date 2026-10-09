"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CATEGORIES, PRICE_RANGES, PRODUCTS, PRODUCT_SEGMENT_LABELS, productBrands, type Product, type ProductSegment } from "@/data/products";
import { resolvePrice } from "@solar/core";
import { useLang } from "@/i18n/LangProvider";
import ProductCard from "@/components/ProductCard";

const ProductQuickView = dynamic(() => import("@/components/ProductQuickView"), { ssr: false });

const BRANDS = productBrands();
const TECHS = Array.from(new Set(PRODUCTS.flatMap((p) => p.tech))).sort();
const MIN_POWER = [["0.6", "≥ 600 W (tấm pin)"], ["1", "≥ 1 kW"], ["5", "≥ 5 kW / kWh"], ["10", "≥ 10 kW / kWh"], ["50", "≥ 50 kW"], ["100", "≥ 100 kW"], ["200", "≥ 200 kWh"]] as const;
const KEYS = ["category", "brand", "tech", "segment", "minPower", "maxPower", "gia", "sort"] as const;

/** Lưới sản phẩm (không có bộ lọc) — dùng làm nội dung render sẵn phía server trước khi đọc tham số URL. */
export function ProductGrid({ list, onQuickView }: { list: Product[]; onQuickView: (p: Product) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
      {list.map((p) => <ProductCard key={p.slug} product={p} onQuickView={onQuickView} />)}
    </div>
  );
}

/**
 * Catalog /san-pham. Bộ lọc nằm trên URL (?category=&brand=&tech=&segment=&minPower=&maxPower=&gia=&sort=) — mega menu "Thiết bị"
 * và thương hiệu trỏ thẳng vào đây. Chọn nhiều sản phẩm → giỏ yêu cầu báo giá (không thanh toán).
 */
export default function ProductCatalog() {
  const { tr } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [quick, setQuick] = useState<Product | null>(null);
  const [drawer, setDrawer] = useState(false);

  const q = Object.fromEntries(KEYS.map((k) => [k, search.get(k) || ""])) as Record<(typeof KEYS)[number], string>;
  const category = CATEGORIES.some((c) => c.value === q.category) ? q.category : "";
  const range = PRICE_RANGES.find((r) => r.value === q.gia);
  const minPower = Number(q.minPower) || 0;
  const maxPower = Number(q.maxPower) || 0;
  const sort = q.sort || "featured";

  const setQuery = (key: (typeof KEYS)[number], value: string) => {
    const next = new URLSearchParams(search.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.replace(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
  };
  const clear = () => router.replace(pathname, { scroll: false });
  const active = KEYS.filter((k) => k !== "sort" && q[k]).length;

  const list = useMemo(() => {
    let items = PRODUCTS.filter((p) => {
      if (category && p.category !== category) return false;
      if (q.brand && p.brand !== q.brand) return false;
      if (q.tech && !p.tech.includes(q.tech)) return false;
      if (q.segment && !p.segment.includes(q.segment as ProductSegment)) return false;
      if (minPower && p.powerKw < minPower) return false;
      if (maxPower && p.powerKw > maxPower) return false;
      if (range) {
        const { current } = resolvePrice(p.price, p.salePrice);
        if (current === undefined || current < range.min || current >= range.max) return false;
      }
      return true;
    });
    const price = (p: Product) => resolvePrice(p.price, p.salePrice).current ?? Number.MAX_SAFE_INTEGER;
    if (sort === "price-asc") items = [...items].sort((a, b) => price(a) - price(b));
    if (sort === "power-desc") items = [...items].sort((a, b) => b.powerKw - a.powerKw);
    return items;
  }, [category, q.brand, q.tech, q.segment, minPower, maxPower, range, sort]);

  const selects = (
    <div className="grid gap-5">
      <label className="t15-label">{tr("Hãng", "Brand")}
        <select value={q.brand} onChange={(e) => setQuery("brand", e.target.value)} className="t15-input"><option value="">{tr("Tất cả hãng", "All brands")}</option>{BRANDS.map((b) => <option key={b}>{b}</option>)}</select>
      </label>
      <label className="t15-label">{tr("Công nghệ", "Technology")}
        <select value={q.tech} onChange={(e) => setQuery("tech", e.target.value)} className="t15-input"><option value="">{tr("Tất cả công nghệ", "All technologies")}</option>{TECHS.map((t) => <option key={t}>{t}</option>)}</select>
      </label>
      <label className="t15-label">{tr("Phân khúc", "Segment")}
        <select value={q.segment} onChange={(e) => setQuery("segment", e.target.value)} className="t15-input"><option value="">{tr("Tất cả phân khúc", "All segments")}</option>{Object.entries(PRODUCT_SEGMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </label>
      <label className="t15-label">{tr("Công suất / dung lượng tối thiểu", "Minimum power / capacity")}
        <select value={q.minPower} onChange={(e) => setQuery("minPower", e.target.value)} className="t15-input">
          <option value="">{tr("Không giới hạn", "Any")}</option>
          {q.minPower && !MIN_POWER.some(([v]) => v === q.minPower) && <option value={q.minPower}>≥ {q.minPower}</option>}
          {MIN_POWER.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      {maxPower > 0 && <button type="button" onClick={() => setQuery("maxPower", "")} className="t15-chip justify-between" aria-label={tr("Bỏ giới hạn công suất tối đa", "Clear max power")}>{tr("Tối đa", "Max")} {maxPower} kW <XMarkIcon className="h-4 w-4" /></button>}
      {active > 0 && <button type="button" onClick={clear} className="t15-button t15-button-secondary">{tr("Xóa tất cả bộ lọc", "Clear all filters")} ({active})</button>}
    </div>
  );

  return (
    <section className="t15-section bg-bg" aria-labelledby="catalog-title">
      <div className="t15-container">
        <h2 id="catalog-title" className="sr-only">{tr("Danh sách sản phẩm", "Product list")}</h2>
        <div className="grid gap-4 border-b border-line/10 pb-6">
          <div>
            <div className="t15-filter-title" id="f-cat">{tr("Danh mục", "Category")}</div>
            <div className="t15-no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-labelledby="f-cat">
              <button type="button" aria-pressed={!category} onClick={() => setQuery("category", "")} className="t15-chip shrink-0">{tr("Tất cả", "All")}</button>
              {CATEGORIES.map((c) => <button key={c.value} type="button" aria-pressed={category === c.value} onClick={() => setQuery("category", c.value)} className="t15-chip shrink-0">{tr(c.label, c.en)}</button>)}
            </div>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="t15-filter-title" id="f-price">{tr("Khoảng giá", "Price range")}</div>
              <div className="t15-no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-labelledby="f-price">
                <button type="button" aria-pressed={!range} onClick={() => setQuery("gia", "")} className="t15-chip shrink-0">{tr("Mọi mức giá", "Any price")}</button>
                {PRICE_RANGES.map((r) => <button key={r.value} type="button" aria-pressed={range?.value === r.value} onClick={() => setQuery("gia", r.value)} className="t15-chip shrink-0">{r.label}</button>)}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDrawer(true)} className="t15-button t15-button-secondary lg:hidden"><AdjustmentsHorizontalIcon className="h-5 w-5" />{tr("Bộ lọc", "Filters")}{active > 0 && ` (${active})`}</button>
              <label className="sr-only" htmlFor="catalog-sort">{tr("Sắp xếp", "Sort")}</label>
              <select id="catalog-sort" value={sort} onChange={(e) => setQuery("sort", e.target.value === "featured" ? "" : e.target.value)} className="t15-input !mt-0 !w-auto">
                <option value="featured">{tr("Đề xuất", "Recommended")}</option>
                <option value="price-asc">{tr("Giá thấp → cao", "Price low → high")}</option>
                <option value="power-desc">{tr("Công suất cao → thấp", "Power high → low")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">{selects}</aside>
          <div>
            <p className="mb-5 text-sm text-fg-muted" aria-live="polite"><strong className="text-fg">{list.length}</strong> {tr("sản phẩm", "products")}{range ? tr(" (không gồm sản phẩm giá liên hệ)", " (excluding contact-for-price items)") : ""}</p>
            {list.length ? <ProductGrid list={list} onQuickView={setQuick} /> : (
              <div className="t15-card p-10 text-center">
                <div className="text-xl font-black text-fg">{tr("Không có sản phẩm phù hợp", "No matching products")}</div>
                <p className="mt-2 text-fg-muted">{tr("Hãy nới công suất, khoảng giá hoặc chọn lại hãng.", "Try a wider power or price range, or another brand.")}</p>
                <button type="button" onClick={clear} className="t15-button t15-button-primary mt-5">{tr("Xóa bộ lọc", "Clear filters")}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-scrim/50 lg:hidden" role="dialog" aria-modal="true" aria-label={tr("Bộ lọc", "Filters")}>
          <button type="button" tabIndex={-1} className="absolute inset-0" onClick={() => setDrawer(false)} aria-label={tr("Đóng bộ lọc", "Close filters")} />
          <aside className="relative h-full w-[88%] max-w-sm overflow-y-auto rounded-l-[28px] bg-bg-elevated p-6">
            <div className="flex items-center justify-between"><h2 className="text-xl font-black">{tr("Bộ lọc", "Filters")}</h2><button type="button" onClick={() => setDrawer(false)} className="t15-icon-button" aria-label={tr("Đóng bộ lọc", "Close filters")}><XMarkIcon className="h-5 w-5" /></button></div>
            <div className="mt-6">{selects}</div>
            <button type="button" onClick={() => setDrawer(false)} className="t15-button t15-button-primary mt-6 w-full">{tr(`Xem ${list.length} sản phẩm`, `Show ${list.length} products`)}</button>
          </aside>
        </div>
      )}
      {quick && <ProductQuickView product={quick} onClose={() => setQuick(null)} />}
    </section>
  );
}

/** Nội dung render sẵn (SEO, không nhảy layout) trong lúc chờ đọc tham số lọc trên URL — đủ toàn bộ sản phẩm. */
export function CatalogFallback() {
  const [quick, setQuick] = useState<Product | null>(null);
  return (
    <section className="t15-section bg-bg">
      <div className="t15-container">
        <ProductGrid list={PRODUCTS} onQuickView={setQuick} />
      </div>
      {quick && <ProductQuickView product={quick} onClose={() => setQuick(null)} />}
    </section>
  );
}
