"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { PRODUCTS, PRODUCT_CATEGORY_LABELS, PRODUCT_SEGMENT_LABELS, type ProductSegment } from "@/data/solar";
import { productBrands } from "@/utils/solar";
import PriceTag from "@/components/PriceTag";
import { useRFQ } from "@/components/SiteShell";

const categories: [string, string][] = [["", "Tất cả"], ...Object.entries(PRODUCT_CATEGORY_LABELS)];
const allTech = Array.from(new Set(PRODUCTS.flatMap((p) => p.tech))).sort();

export default function ProductCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const rfq = useRFQ();
  const [drawer, setDrawer] = useState(false);

  const category = search.get("category") || "";
  const brand = search.get("brand") || "";
  const minPower = Number(search.get("minPower") || 0);
  const maxPower = Number(search.get("maxPower") || 0);
  const tech = search.get("tech") || "";
  const segment = (search.get("segment") || "") as ProductSegment | "";
  const maxPrice = Number(search.get("maxPrice") || 0);
  const sort = search.get("sort") || "featured";

  const setQuery = (key: string, value: string) => {
    const next = new URLSearchParams(search.toString());
    value ? next.set(key,value) : next.delete(key);
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll:false });
  };

  const list = useMemo(() => {
    let items = PRODUCTS.filter((p) => (!category || p.category === category) && (!brand || p.brand === brand) && (!minPower || p.powerKw >= minPower) && (!maxPower || p.powerKw <= maxPower)
      && (!tech || p.tech.includes(tech)) && (!segment || p.segment.includes(segment)) && (!maxPrice || (p.price || Number.MAX_SAFE_INTEGER) <= maxPrice));
    if (sort === "price-asc") items = [...items].sort((a,b) => (a.price || Number.MAX_SAFE_INTEGER) - (b.price || Number.MAX_SAFE_INTEGER));
    if (sort === "power-desc") items = [...items].sort((a,b) => b.powerKw - a.powerKw);
    return items;
  }, [category,brand,minPower,maxPower,tech,segment,maxPrice,sort]);

  const Filters = () => <div className="grid gap-5">
    <div><div className="t5-filter-title">Loại thiết bị</div><div className="mt-3 grid gap-1">{categories.map(([value,label]) => <button key={label} onClick={() => setQuery("category",value)} className={`t5-filter-option ${category === value ? "is-active" : ""}`}>{label}</button>)}</div></div>
    <label className="t5-label">Hãng<select value={brand} onChange={(e) => setQuery("brand",e.target.value)} className="t5-input"><option value="">Tất cả hãng</option>{productBrands().map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="t5-label">Công nghệ<select value={tech} onChange={(e) => setQuery("tech",e.target.value)} className="t5-input"><option value="">Tất cả công nghệ</option>{allTech.map((t) => <option key={t}>{t}</option>)}</select></label>
    <label className="t5-label">Phân khúc<select value={segment} onChange={(e) => setQuery("segment",e.target.value)} className="t5-input"><option value="">Tất cả phân khúc</option>{Object.entries(PRODUCT_SEGMENT_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
    <label className="t5-label">Công suất / dung lượng tối thiểu<select value={String(minPower || "")} onChange={(e) => setQuery("minPower",e.target.value)} className="t5-input"><option value="">Không giới hạn</option>{!["0.6","1","5","10","50","100","200",""].includes(String(minPower || "")) && <option value={String(minPower)}>≥ {minPower}</option>}<option value="0.6">≥ 600 W (tấm pin)</option><option value="1">≥ 1 kW</option><option value="5">≥ 5 kW</option><option value="10">≥ 10 kW / kWh</option><option value="50">≥ 50 kW</option><option value="100">≥ 100 kW</option><option value="200">≥ 200 kWh</option></select></label>
    {maxPower > 0 && <button type="button" onClick={() => setQuery("maxPower","")} className="t12-chip justify-between" aria-label="Bỏ giới hạn công suất tối đa">Tối đa {maxPower} kW <XMarkIcon className="h-4 w-4" /></button>}
    <label className="t5-label">Khoảng giá<select value={String(maxPrice || "")} onChange={(e) => setQuery("maxPrice",e.target.value)} className="t5-input"><option value="">Không giới hạn</option><option value="5000000">Dưới 5 triệu</option><option value="50000000">Dưới 50 triệu</option><option value="100000000">Dưới 100 triệu</option></select></label>
  </div>;

  return (
    <section className="t5-section bg-bg-elevated">
      <div className="t5-container">
        <div className="flex flex-col gap-4 border-b border-line/12 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><span className="t5-eyebrow">Catalog kỹ thuật</span><h2 className="mt-2 text-3xl font-black text-primary">Thiết bị theo cấu hình hệ thống</h2></div>
          <div className="flex gap-2"><button type="button" onClick={() => setDrawer(true)} className="t5-button t5-button-secondary lg:hidden"><AdjustmentsHorizontalIcon className="h-5 w-5" /> Bộ lọc</button><select value={sort} onChange={(e) => setQuery("sort",e.target.value)} className="t5-input !w-auto"><option value="featured">Đề xuất</option><option value="price-asc">Giá thấp → cao</option><option value="power-desc">Công suất cao → thấp</option></select></div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="hidden border-r border-line/12 pr-6 lg:block"><Filters /></aside>
          <div>
            <div className="mb-5 text-sm text-fg-muted"><strong className="text-fg">{list.length}</strong> thiết bị phù hợp</div>
            {list.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{list.map((p) => <article key={p.slug} className="t8-card group flex h-full flex-col overflow-hidden">
              <Link href={`/san-pham/${p.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-bg-elevated"><Image src={p.image} alt={`${p.brand} ${p.name}`} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" /></Link>
              <div className="flex flex-1 flex-col p-5"><div className="text-xs font-black uppercase tracking-[.16em] text-fg-subtle">{p.brand}</div><Link href={`/san-pham/${p.slug}`}><h3 className="mt-2 text-lg font-black leading-snug text-primary">{p.name}</h3></Link>
              <dl className="mt-4 grid gap-2 text-sm">{Object.entries(p.specs).slice(0,3).map(([k,v]) => <div key={k} className="flex justify-between gap-4 border-b border-line/12 pb-2"><dt className="text-fg-muted">{k}</dt><dd className="text-right font-bold text-fg">{v}</dd></div>)}</dl>
              <div className="mt-auto pt-5"><PriceTag price={p.price} salePrice={p.salePrice} quoteOnly={p.quoteOnly} /><div className="mt-3 grid grid-cols-2 gap-2"><Link href={`/san-pham/${p.slug}`} className="t5-button t5-button-secondary justify-center">Chi tiết</Link><button type="button" onClick={() => { rfq.add(p.slug); rfq.open(); }} className="t5-button t5-button-primary justify-center">Thêm RFQ</button></div></div>
              </div>
            </article>)}</div> : <div className="border border-dashed border-line/20 bg-bg-elevated p-12 text-center"><div className="text-xl font-black text-primary">Không có kết quả</div><p className="mt-2 text-fg-muted">Hãy nới công suất, khoảng giá hoặc chọn lại hãng.</p><button type="button" onClick={() => router.replace(pathname)} className="mt-5 t5-button t5-button-primary">Xóa bộ lọc</button></div>}
          </div>
        </div>
      </div>

      {drawer && <div className="fixed inset-0 z-[80] flex justify-end bg-scrim/60 lg:hidden"><button className="absolute inset-0" onClick={() => setDrawer(false)} aria-label="Đóng bộ lọc" /><aside className="relative h-full w-[88%] max-w-sm overflow-y-auto bg-bg-elevated p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Bộ lọc</h2><button onClick={() => setDrawer(false)} className="t5-icon-button"><XMarkIcon className="h-5 w-5" /></button></div><div className="mt-6"><Filters /></div></aside></div>}
    </section>
  );
}