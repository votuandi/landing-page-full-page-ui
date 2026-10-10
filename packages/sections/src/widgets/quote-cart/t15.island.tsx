"use client";
import { useEffect, useRef, useState } from "react";
import { useDialog, PriceTag, MediaImage } from "@solar/ui";
import { MinusIcon, PlusIcon, ShoppingBagIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { readQuoteCart, writeQuoteCart, onQuoteCartChange, onOpenQuoteCart, sanitizeCart, setQty, removeItem, clearCart, countItems, MAX_QTY, type CartLine } from "@solar/core";
import { LeadForm } from "../../shared/LeadForm";
import type { Locale } from "../../site";
import type { ClientLink } from "../../shared/links";

type Product = { slug: string; name: string; price?: number; salePrice?: number; image: { src?: string; alt: string } };
type Labels = Record<"title" | "note" | "emptyText" | "browseLabel" | "formTitle" | "formDescription" | "messagePlaceholder" | "submitLabel" | "successTitle" | "successMessage" | "continueLabel" | "buttonLabel", string>;
type Props = { sectionId: string; locale: Locale; items: Product[]; labels: Labels; browseLink: Omit<ClientLink, "label"> };

export default function QuoteCart(props: Props) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const refresh = () => setLines(sanitizeCart(readQuoteCart(), (sku) => props.items.some((item) => item.slug === sku)));
    refresh();
    const stopChange = onQuoteCartChange(refresh);
    const stopOpen = onOpenQuoteCart(() => setOpen(true));
    return () => { stopChange(); stopOpen(); };
  }, [props.items]);
  const count = countItems(lines);
  return <>
    {(count > 0 || open) && <button type="button" onClick={() => setOpen(true)} aria-label={props.labels.buttonLabel} aria-expanded={open}
      className="fixed bottom-24 right-3 z-40 flex min-h-12 items-center gap-2 rounded-pill bg-primary px-4 py-3 font-black text-on-primary shadow-float lg:bottom-24 lg:right-24">
      <ShoppingBagIcon aria-hidden className="h-6 w-6" /><span data-cart-count className="grid min-h-6 min-w-6 place-items-center rounded-pill bg-accent px-1 text-xs text-on-accent">{count}</span>
    </button>}
    {open && <CartDrawer {...props} lines={lines} onClose={() => setOpen(false)} />}
  </>;
}

function CartDrawer({ sectionId, locale, items, labels, browseLink, lines, onClose }: Props & { lines: CartLine[]; onClose: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const [done, setDone] = useState(false);
  useDialog(ref, true, onClose);
  const rows = lines.flatMap((line) => {
    const product = items.find((item) => item.slug === line.sku);
    return product ? [{ ...line, product }] : [];
  });
  const ui = locale === "vi" ? { close: "Đóng giỏ báo giá", less: "Giảm số lượng", more: "Tăng số lượng", remove: "Xóa", privacy: "Thông tin chỉ dùng để báo giá." }
    : { close: "Close quote cart", less: "Decrease quantity", more: "Increase quantity", remove: "Remove", privacy: "Your details are used for this quote only." };
  const browse = (label: string) => <a href={browseLink.href} target={browseLink.external ? "_blank" : undefined} rel={browseLink.external ? "noopener noreferrer" : undefined} className="t15-button t15-button-primary mt-4">{label}</a>;
  return <div className="fixed inset-0 z-[85] flex justify-end bg-scrim/40 backdrop-blur-sm" role="presentation">
    <button type="button" tabIndex={-1} aria-hidden className="absolute inset-0 cursor-default" onClick={onClose} />
    <aside ref={ref} role="dialog" aria-modal="true" aria-labelledby={sectionId + "-title"} tabIndex={-1}
      className="relative flex h-full w-full max-w-md flex-col overflow-y-auto rounded-l-media bg-bg-elevated shadow-2xl">
      <div className="sticky top-0 z-10 border-b border-line/10 bg-bg-elevated/95 px-6 py-5 backdrop-blur-xl">
        <div aria-hidden className="t15-energy-line absolute inset-x-0 top-0 h-1" />
        <div className="flex items-center justify-between gap-3"><div><h2 id={sectionId + "-title"} className="text-xl font-black text-fg">{labels.title}</h2><p className="text-xs text-fg-muted">{labels.note}</p></div>
          <button type="button" onClick={onClose} className="t15-icon-button shrink-0" aria-label={ui.close} data-autofocus><XMarkIcon aria-hidden className="h-5 w-5" /></button></div>
      </div>
      <div className="flex-1 px-6 py-5 pb-28">
        {done ? <div role="status" className="rounded-card border border-success/40 bg-success/10 p-6 text-center"><h3 className="font-black text-fg">{labels.successTitle}</h3><p className="mt-2 text-sm text-fg-muted">{labels.successMessage}</p>{browse(labels.continueLabel)}</div>
          : rows.length === 0 ? <div className="text-center text-fg-muted"><p>{labels.emptyText}</p>{browse(labels.browseLabel)}</div>
          : <><ul className="space-y-4">{rows.map(({ sku, qty, product }) => <li key={sku} className="flex gap-3 border-b border-line/10 pb-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-card bg-bg-tint"><MediaImage src={product.image.src} alt={product.image.alt} sizes="80px" className="object-contain" /></div>
            <div className="min-w-0 flex-1"><h3 className="text-sm font-black text-fg">{product.name}</h3><PriceTag price={product.price} salePrice={product.salePrice} className="text-sm" />
              <div className="mt-2 flex items-center gap-2"><button type="button" aria-label={`${ui.less}: ${product.name}`} className="t15-icon-button" onClick={() => writeQuoteCart(setQty(readQuoteCart(), sku, qty - 1))}><MinusIcon aria-hidden className="h-4 w-4" /></button>
                <span aria-live="polite" className="font-bold text-fg">{qty}</span>
                <button type="button" aria-label={`${ui.more}: ${product.name}`} disabled={qty >= MAX_QTY} className="t15-icon-button disabled:opacity-50" onClick={() => writeQuoteCart(setQty(readQuoteCart(), sku, qty + 1))}><PlusIcon aria-hidden className="h-4 w-4" /></button>
                <button type="button" aria-label={`${ui.remove}: ${product.name}`} className="t15-icon-button ml-auto text-danger" onClick={() => writeQuoteCart(removeItem(readQuoteCart(), sku))}><TrashIcon aria-hidden className="h-4 w-4" /></button></div>
            </div>
          </li>)}</ul><h3 className="mt-6 text-lg font-black text-fg">{labels.formTitle}</h3><p className="mb-4 mt-1 text-sm text-fg-muted">{labels.formDescription}</p>
            <LeadForm locale={locale} source="quote-cart" columns={1} fields={{ zalo: false, address: false, message: true }}
              text={{ submit: labels.submitLabel, success: labels.successMessage, privacy: ui.privacy, messagePlaceholder: labels.messagePlaceholder }}
              getExtra={() => ({ items: rows.map(({ sku, qty, product }) => ({ sku, name: product.name, qty })) })}
              onSuccess={() => { writeQuoteCart(clearCart()); setDone(true); }} />
          </>}
      </div>
    </aside>
  </div>;
}
