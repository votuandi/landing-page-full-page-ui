"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ShoppingBagIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CATEGORY_LABEL, type Product } from "@/data/products";
import { useQuoteCart } from "@/lib/quoteCartContext";
import { useDialog } from "@/lib/useDialog";
import AddToQuoteButton from "@/components/AddToQuoteButton";
import PriceTag from "@/components/PriceTag";
import ProductImage from "@/components/ProductImage";

/** Modal "Xem nhanh": ảnh (có ảnh phụ), thông số, giá và nút thêm vào yêu cầu báo giá. */
export default function ProductQuickView({ product, onClose }: { product: Product; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const cart = useQuoteCart();
  useDialog(ref, true, onClose);

  return (
    <div className="fixed inset-0 z-[85] grid place-items-center bg-scrim/50 p-3 backdrop-blur-sm sm:p-6" role="presentation">
      <button type="button" tabIndex={-1} aria-hidden className="absolute inset-0 cursor-default" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="qv-title" tabIndex={-1}
        className="relative grid max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-bg-elevated shadow-2xl md:grid-cols-2">
        <button type="button" onClick={onClose} className="t5-icon-button absolute right-3 top-3 z-10" aria-label="Đóng xem nhanh" data-autofocus><XMarkIcon className="h-5 w-5" /></button>
        <div className="bg-bg-tint p-4 sm:p-6">
          <div className="relative aspect-square overflow-hidden rounded-2xl"><ProductImage src={product.images[active]} alt={product.name} fill sizes="(max-width:768px) 90vw, 440px" className="object-cover" /></div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((src, i) => (
                <button key={src} type="button" onClick={() => setActive(i)} aria-label={`Ảnh ${i + 1}`} aria-pressed={i === active}
                  className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 ${i === active ? "border-primary" : "border-transparent"}`}>
                  <ProductImage src={src} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col p-6 sm:p-8">
          <div className="text-xs font-black uppercase tracking-[.16em] text-fg-subtle">{product.brand} · {CATEGORY_LABEL[product.category]}</div>
          <h2 id="qv-title" className="mt-2 pr-10 text-2xl font-black leading-tight text-fg">{product.name}</h2>
          <div className="mt-3"><PriceTag price={product.price} salePrice={product.salePrice} className="text-2xl" />{product.unit && product.price ? <span className="text-xs text-fg-muted">/{product.unit}</span> : null}</div>
          <dl className="mt-5 divide-y divide-line/12 rounded-2xl border border-line/12 text-sm">
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-fg-muted">{k}</dt><dd className="text-right font-bold text-fg">{v}</dd></div>
            ))}
            <div className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-fg-muted">Bảo hành</dt><dd className="text-right font-bold text-fg">{product.warranty}</dd></div>
          </dl>
          <div className="mt-auto grid gap-2 pt-6 sm:grid-cols-2">
            <AddToQuoteButton sku={product.sku} name={product.name} className="sm:col-span-2" />
            <button type="button" onClick={() => { onClose(); cart.open(); }} className="t5-button t5-button-secondary"><ShoppingBagIcon className="h-4 w-4" />Xem giỏ báo giá</button>
            <Link href={`/san-pham/${product.sku}`} className="t5-button t5-button-secondary" onClick={onClose}>Trang chi tiết</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
