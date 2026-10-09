"use client";

import { PriceTag } from "@solar/ui";

import Link from "next/link";
import { EyeIcon } from "@heroicons/react/24/outline";
import { CATEGORY_LABEL, type Product } from "@/data/products";
import { useLang } from "@/i18n/LangProvider";
import AddToQuoteButton from "@/components/AddToQuoteButton";

import ProductImage from "@/components/ProductImage";

/** Thẻ sản phẩm: ảnh, hãng, tên, 2 thông số, giá (theo quy tắc chung), "Xem nhanh" và "Thêm vào yêu cầu báo giá". */
export default function ProductCard({ product, onQuickView, compact = false }: { product: Product; onQuickView: (p: Product) => void; compact?: boolean }) {
  const { tr } = useLang();
  const specs = Object.entries(product.specs).slice(0, compact ? 0 : 2);
  return (
    <article className="t15-card t15-card-hover group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-bg-tint">
        <ProductImage src={product.images[0]} alt={product.name} fill loading="lazy" sizes="(max-width:640px) 70vw, (max-width:1024px) 33vw, 280px" className="object-cover transition duration-700 group-hover:scale-[1.05]" />
        <span className="absolute left-3 top-3 rounded-full bg-bg-elevated/95 px-2.5 py-1 text-[11px] font-bold text-fg-muted shadow-sm">{CATEGORY_LABEL[product.category]}</span>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="text-[11px] font-black uppercase tracking-[.16em] text-secondary">{product.brand}</div>
        <h3 className="mt-1 line-clamp-2 min-h-[2.75rem] font-black leading-snug text-fg"><Link href={`/san-pham/${product.slug}`} className="hover:text-primary">{product.name}</Link></h3>
        {specs.length > 0 && (
          <dl className="mt-3 grid gap-1.5 text-xs">
            {specs.map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-line/10 pb-1.5"><dt className="text-fg-muted">{k}</dt><dd className="text-right font-bold text-fg">{v}</dd></div>)}
          </dl>
        )}
        <div className="mt-3"><PriceTag price={product.price} salePrice={product.salePrice} className={compact ? "text-base" : "text-lg"} /></div>
        <div className={`mt-auto grid gap-2 pt-4 ${compact ? "grid-cols-[auto_1fr]" : "grid-cols-[auto_1fr]"}`}>
          <button type="button" onClick={() => onQuickView(product)} className="t15-button t15-button-secondary !px-4" aria-label={`${tr("Xem nhanh", "Quick view")} ${product.name}`}><EyeIcon className="h-4 w-4" /></button>
          <AddToQuoteButton sku={product.slug} name={product.name} compact />
        </div>
      </div>
    </article>
  );
}
