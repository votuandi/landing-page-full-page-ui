"use client";
import { useRef, useState } from "react";
import { CarouselNav, MediaImage, PriceTag, useDialog, useSnapCarousel } from "@solar/ui";
import { ShoppingBagIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { addToQuoteCart, openQuoteCart, priceView } from "@solar/core";
import type { ProductItem } from "../collections/schemas";
import type { Locale } from "../site";

type ProductView = Omit<ProductItem, "images"> & { images: { src?: string; alt: string }[] };
type Labels = { quick: string; add: string; compactAdd: string; added: string; cart: string; details: string; warranty: string; contact: string };
function Price({ item, contact }: { item: ProductView; contact: string }) {
  return priceView(item.price, item.salePrice).kind === "contact"
    ? <div className="font-black text-primary">{contact}</div>
    : <PriceTag price={item.price} salePrice={item.salePrice} />;
}
function Add({ item, labels, compact = false }: { item: ProductView; labels: Labels; compact?: boolean }) {
  const [added, setAdded] = useState(false);
  return <div>
    <button type="button" className="t15-button t15-button-primary w-full text-sm" onClick={() => { addToQuoteCart(item.slug); setAdded(true); }}>
      <ShoppingBagIcon aria-hidden className="h-4 w-4" />{compact ? labels.compactAdd : labels.add}
    </button>
    <span role="status" className="block min-h-5 text-xs font-bold text-primary">{added ? labels.added : ""}</span>
  </div>;
}
function QuickView({ item, labels, sectionId, close, locale }: { item: ProductView; labels: Labels; sectionId: string; close: () => void; locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useDialog(ref, true, close);
  return <div className="fixed inset-0 z-[85] grid place-items-center bg-scrim/50 p-3 backdrop-blur-sm sm:p-6" role="presentation">
    <button type="button" tabIndex={-1} aria-hidden className="absolute inset-0 cursor-default" onClick={close} />
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={sectionId + "-quick-title"} tabIndex={-1}
      className="relative grid max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-card bg-bg-elevated shadow-2xl md:grid-cols-2">
      <button data-autofocus type="button" onClick={close} className="t15-icon-button absolute right-3 top-3 z-10" aria-label={locale === "en" ? "Close quick view" : "Đóng xem nhanh"}><XMarkIcon aria-hidden className="h-5 w-5" /></button>
      <div className="bg-bg-tint p-4 sm:p-6">
        <div className="relative aspect-square overflow-hidden rounded-media"><MediaImage src={item.images[active].src} alt={item.images[active].alt} sizes="(max-width:768px) 90vw, 440px" /></div>
        {item.images.length > 1 && <div className="mt-3 flex flex-wrap gap-2">{item.images.map((image, i) =>
          <button key={i} type="button" onClick={() => setActive(i)} aria-label={(locale === "en" ? "Image " : "Ảnh ") + (i + 1)} aria-pressed={active === i}
            className={"relative h-16 w-16 overflow-hidden rounded-media border-2 " + (i === active ? "border-primary" : "border-transparent")}>
            <MediaImage src={image.src} alt="" sizes="64px" />
          </button>)}</div>}
      </div>
      <div className="flex flex-col p-6 sm:p-8">
        <div className="text-xs font-black uppercase tracking-[.16em] text-secondary">{item.brand} · {item.categoryLabel}</div>
        <h2 id={sectionId + "-quick-title"} className="mt-2 pr-10 text-2xl font-black leading-tight text-fg">{item.name}</h2>
        <div className="mt-3"><Price item={item} contact={labels.contact} />{item.unit && item.price ? <span className="text-xs text-fg-muted">/{item.unit}</span> : null}</div>
        <dl className="mt-5 divide-y divide-line/10 rounded-card border border-line/10 text-sm">
          {item.specs.map((spec, i) => <div key={i} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-fg-muted">{spec.label}</dt><dd className="text-right font-bold text-fg">{spec.value}</dd></div>)}
          <div className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-fg-muted">{labels.warranty}</dt><dd className="text-right font-bold text-fg">{item.warranty}</dd></div>
        </dl>
        <div className="mt-auto grid gap-2 pt-6">
          <Add item={item} labels={labels} />
          <button type="button" className="t15-button t15-button-secondary" onClick={() => { close(); openQuoteCart(); }}>{labels.cart}</button>
          <a href={item.href} className="t15-button t15-button-secondary">{labels.details}</a>
        </div>
      </div>
    </div>
  </div>;
}
export default function Products({ items, labels, sectionId, locale }: { items: ProductView[]; labels: Labels; sectionId: string; locale: Locale }) {
  const [quick, setQuick] = useState<ProductView | null>(null);
  const c = useSnapCarousel();
  return <>
    <div className="mt-4 flex justify-end"><CarouselNav prevLabel={locale === "en" ? "Previous" : "Trước"} nextLabel={locale === "en" ? "Next" : "Tiếp"} prev={c.prev} next={c.next} atStart={c.atStart} atEnd={c.atEnd} /></div>
    <div ref={c.ref} className="t15-no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0">
      {items.map((item) => <article key={item.id} className="t15-card group flex w-[calc((100%-0.75rem)/1.6)] shrink-0 snap-start flex-col overflow-hidden sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]">
        <a href={item.href} className="relative block aspect-square bg-bg-tint"><MediaImage src={item.images[0].src} alt={item.images[0].alt} sizes="(max-width:640px) 60vw, 300px" /></a>
        <div className="flex flex-1 flex-col p-3 sm:p-5">
          <div className="text-xs font-black text-secondary">{item.categoryLabel} · {item.brand}</div>
          <h3 className="mt-2 text-sm font-black text-fg sm:text-base"><a href={item.href}>{item.name}</a></h3>
          <div className="mt-auto pt-3"><Price item={item} contact={labels.contact} /></div>
          <button type="button" onClick={() => setQuick(item)} className="t15-button t15-button-secondary my-2 text-xs">{labels.quick}<span className="sr-only">: {item.name}</span></button>
          <Add item={item} labels={labels} compact />
        </div>
      </article>)}
    </div>
    {quick && <QuickView key={quick.id} item={quick} labels={labels} sectionId={sectionId} close={() => setQuick(null)} locale={locale} />}
  </>;
}
