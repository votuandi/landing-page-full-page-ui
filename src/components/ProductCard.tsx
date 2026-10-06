"use client";

import Link from "next/link";
import { EyeIcon } from "@heroicons/react/24/outline";
import { CATEGORY_LABEL, type Product } from "@/data/products";
import AddToQuoteButton from "@/components/AddToQuoteButton";
import PriceTag from "@/components/PriceTag";
import ProductImage from "@/components/ProductImage";

/** Thẻ sản phẩm: ảnh, hãng, tên, giá (theo quy tắc chung), "Xem nhanh" và "Thêm vào yêu cầu báo giá". */
export default function ProductCard({ product, onQuickView, compact = false }: { product: Product; onQuickView: (p: Product) => void; compact?: boolean }) {
  return (
    <article className="t8-card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1.5">
      <div className="relative aspect-square overflow-hidden bg-bg-tint">
        <ProductImage src={product.images[0]} alt={product.name} fill loading="lazy" sizes="(max-width:640px) 70vw, (max-width:1024px) 33vw, 280px" className="object-cover transition duration-700 group-hover:scale-[1.05]" />
        <span className="absolute left-3 top-3 rounded-full bg-bg-elevated/90 px-2.5 py-1 text-[11px] font-bold text-fg-muted">{CATEGORY_LABEL[product.category]}</span>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="text-[11px] font-black uppercase tracking-[.16em] text-fg-subtle">{product.brand}</div>
        <h3 className="mt-1 line-clamp-2 min-h-[2.75rem] font-black leading-snug text-fg"><Link href={`/san-pham/${product.sku}`} className="hover:text-primary">{product.name}</Link></h3>
        <div className="mt-3"><PriceTag price={product.price} salePrice={product.salePrice} className={compact ? "text-base" : "text-lg"} /></div>
        <div className={`mt-auto grid gap-2 pt-4 ${compact ? "grid-cols-[auto_1fr]" : "grid-cols-1"}`}>
          <button type="button" onClick={() => onQuickView(product)} className="t5-button t5-button-secondary !px-4" aria-label={`Xem nhanh ${product.name}`}><EyeIcon className="h-4 w-4" /><span className={compact ? "sr-only" : ""}>Xem nhanh</span></button>
          <AddToQuoteButton sku={product.sku} name={product.name} compact={compact} />
        </div>
      </div>
    </article>
  );
}
