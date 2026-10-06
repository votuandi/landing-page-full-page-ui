"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATALOG_COPY as C, COPY, PRODUCTS } from "@/content/site";
import { moneyVi } from "@/utils/estimate";
import { useRFQ } from "./SiteShell";
export default function ProductCatalog() {
  const q = useSearchParams(),
    path = usePathname(),
    router = useRouter(),
    rfq = useRFQ();
  const category = q.get("category") ?? "",
    brand = q.get("brand") ?? "",
    min = Number(q.get("minPower") ?? 0),
    max = Number(q.get("maxPrice") ?? 0),
    sort = q.get("sort") ?? "featured";
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(q);
    if (v) next.set(k, v);
    else next.delete(k);
    router.replace(`${path}${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  let list = PRODUCTS.filter(
    (p) =>
      (!category || category === p.category) &&
      (!brand || brand === p.brand) &&
      p.powerKw >= min &&
      (!max || (!!p.price && p.price <= max)),
  );
  if (sort === "price-asc")
    list = [...list].sort(
      (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
    );
  if (sort === "power-desc")
    list = [...list].sort((a, b) => b.powerKw - a.powerKw);
  return (
    <section className="t5-section bg-slate-50">
      <div className="t5-container">
        <div className="t8-card mb-8 grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-5">
          <label className="t5-label">
            {C.category}
            <select
              className="t5-input"
              value={category}
              onChange={(e) => set("category", e.target.value)}
            >
              {C.categories.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="t5-label">
            {C.brand}
            <select
              className="t5-input"
              value={brand}
              onChange={(e) => set("brand", e.target.value)}
            >
              <option value="">{C.allBrands}</option>
              {Array.from(new Set(PRODUCTS.map((p) => p.brand))).map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label className="t5-label">
            {C.minimumPower}
            <input
              className="t5-input"
              type="number"
              min="0"
              value={min || ""}
              onChange={(e) => set("minPower", e.target.value)}
            />
          </label>
          <label className="t5-label">
            {C.maxPrice}
            <input
              className="t5-input"
              type="number"
              min="0"
              value={max || ""}
              onChange={(e) => set("maxPrice", e.target.value)}
            />
          </label>
          <label className="t5-label">
            {C.sort}
            <select
              className="t5-input"
              value={sort}
              onChange={(e) => set("sort", e.target.value)}
            >
              <option value="featured">{C.featured}</option>
              <option value="price-asc">{C.priceAsc}</option>
              <option value="power-desc">{C.powerDesc}</option>
            </select>
          </label>
        </div>
        <div className="mb-7 flex items-center justify-between gap-4">
          <p className="text-sm font-bold" role="status">
            {list.length} {C.results}
          </p>
          <button
            className="t5-button t5-button-secondary"
            onClick={() => router.replace(path, { scroll: false })}
          >
            {C.reset}
          </button>
        </div>
        {!list.length && <p className="py-12 text-slate-600">{C.empty}</p>}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <article key={p.slug} className="t8-card overflow-hidden">
              <Link href={`/product/${p.slug}`}>
                <div className="relative aspect-[4/3]">
                  <Image
                    src={p.image}
                    alt={`${COPY.imageNote}: ${p.name}`}
                    fill
                    sizes="(min-width:1024px) 390px, (min-width:768px) 48vw, 95vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs text-slate-600">{p.brand}</p>
                  <h2 className="mt-2 text-xl font-black">{p.name}</h2>
                  <p className="mt-4 font-bold text-blue-900">
                    {p.price ? moneyVi(p.price) : C.quote}
                  </p>
                </div>
              </Link>
              <div className="px-6 pb-6">
                <button
                  className="t5-button t5-button-primary w-full"
                  onClick={() => {
                    rfq.add(p.slug);
                    rfq.open();
                  }}
                >
                  {rfq.items.includes(p.slug) ? C.added : C.add}
                </button>
                <p className="mt-3 text-xs text-slate-600">{COPY.demoShort}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
