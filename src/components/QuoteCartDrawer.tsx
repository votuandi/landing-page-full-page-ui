"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircleIcon, MinusIcon, PlusIcon, ShoppingBagIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { SITE_CONFIG } from "@/config/site";
import { productBySku } from "@/data/products";
import { useQuoteCart } from "@/lib/quoteCartContext";
import { STORAGE_KEYS, readJson } from "@/lib/storage";
import { useDialog } from "@/lib/useDialog";
import { MAX_QTY } from "@/lib/quoteCart";
import LeadForm from "@/components/LeadForm";
import PriceTag from "@/components/PriceTag";
import ProductImage from "@/components/ProductImage";

type SavedEstimate = { savedAt: number; segment: string; estimate: Record<string, string | number | boolean> };

/** Drawer bên phải: danh sách sản phẩm, chỉnh số lượng, xóa, form gửi yêu cầu báo giá (không thanh toán). */
export default function QuoteCartDrawer({ onClose }: { onClose: () => void }) {
  const cart = useQuoteCart();
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState<SavedEstimate | null>(null);
  const [attach, setAttach] = useState(true);
  useDialog(ref, true, onClose);

  useEffect(() => { setSaved(readJson<SavedEstimate | null>(STORAGE_KEYS.lastEstimate, null)); }, []);

  const rows = cart.lines.map((l) => ({ ...l, product: productBySku(l.sku) })).filter((r) => r.product);

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-scrim/40 backdrop-blur-sm" role="presentation">
      <button type="button" tabIndex={-1} aria-hidden className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside ref={ref} role="dialog" aria-modal="true" aria-labelledby="cart-title" tabIndex={-1}
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto rounded-l-[32px] bg-bg-elevated/95 shadow-2xl backdrop-blur-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line/12 bg-bg-elevated/95 px-6 py-5 backdrop-blur-xl">
          <div>
            <h2 id="cart-title" className="text-xl font-black text-fg">Giỏ yêu cầu báo giá</h2>
            <p className="text-xs text-fg-muted">Không thanh toán online — chúng tôi gửi báo giá và gọi xác nhận.</p>
          </div>
          <button type="button" onClick={onClose} className="t5-icon-button" aria-label="Đóng giỏ báo giá" data-autofocus><XMarkIcon className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 px-6 py-5">
          {done ? (
            <div role="status" className="rounded-3xl border border-success/40 bg-success/10 p-6 text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-success" />
              <div className="mt-3 text-lg font-black text-fg">Đã gửi yêu cầu báo giá!</div>
              <p className="mt-2 text-sm leading-6 text-fg-muted">Chúng tôi sẽ gọi lại trong {SITE_CONFIG.callbackHours} giờ (trong giờ làm việc).</p>
              <button type="button" onClick={onClose} className="t5-button t5-button-secondary mt-5">Tiếp tục xem</button>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-fg-subtle" />
              <p className="mt-3 text-sm leading-6 text-fg-muted">Chưa có sản phẩm nào. Chọn thiết bị, đèn năng lượng mặt trời rồi gửi một yêu cầu báo giá chung.</p>
              <Link href="/san-pham" onClick={onClose} className="t5-button t5-button-primary mt-5">Xem sản phẩm</Link>
            </div>
          ) : (
            <>
              <ul className="space-y-3" aria-label="Sản phẩm trong giỏ">
                {rows.map(({ sku, qty, product }) => (
                  <li key={sku} className="flex gap-3 rounded-2xl border border-line/12 bg-bg-elevated p-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-bg-tint"><ProductImage src={product!.images[0]} alt="" fill sizes="80px" className="object-cover" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-black leading-snug text-fg">{product!.name}</div>
                      <PriceTag price={product!.price} salePrice={product!.salePrice} className="text-sm" />
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-full border border-line/15" role="group" aria-label={`Số lượng ${product!.name}`}>
                          <button type="button" onClick={() => cart.setQty(sku, qty - 1)} aria-label="Giảm số lượng" className="grid h-11 w-11 place-items-center text-fg"><MinusIcon className="h-4 w-4" /></button>
                          <input value={qty} inputMode="numeric" aria-label="Số lượng" className="w-10 bg-transparent text-center text-sm font-black text-fg focus:outline-none"
                            onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, "")); if (n > 0) cart.setQty(sku, Math.min(MAX_QTY, n)); }} />
                          <button type="button" onClick={() => cart.setQty(sku, qty + 1)} aria-label="Tăng số lượng" className="grid h-11 w-11 place-items-center text-fg"><PlusIcon className="h-4 w-4" /></button>
                        </div>
                        <button type="button" onClick={() => cart.remove(sku)} className="grid h-11 w-11 place-items-center rounded-full text-danger hover:bg-danger/10" aria-label={`Xóa ${product!.name}`}><TrashIcon className="h-5 w-5" /></button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-line/12 pt-6">
                <h3 className="text-lg font-black text-fg">Gửi yêu cầu báo giá</h3>
                <p className="mb-4 mt-1 text-sm text-fg-muted">Để lại số điện thoại, kỹ thuật gọi lại xác nhận số lượng, giá và phí vận chuyển.</p>
                <LeadForm source="quote-cart" columns={1} fields={{ message: true }} messagePlaceholder="Địa chỉ giao hàng, cần lắp đặt hay chỉ mua thiết bị…"
                  submitLabel="Gửi yêu cầu báo giá"
                  getExtra={() => ({
                    items: rows.map((r) => ({ sku: r.sku, name: r.product!.name, qty: r.qty })),
                    ...(saved && attach ? { segment: saved.segment, estimate: saved.estimate } : {}),
                  })}
                  onSuccess={() => { cart.clear(); setDone(true); }}>
                  {saved && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line/15 bg-bg-tint p-3 text-sm text-fg">
                      <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
                      <span><strong>Đính kèm kết quả dự toán</strong><span className="block text-xs text-fg-muted">{saved.segment} · {String(saved.estimate["Công suất đề xuất (kWp)"] ?? "")} kWp · tiết kiệm ~{String(saved.estimate["Tiết kiệm/tháng (đ)"] ?? "")} đ/tháng</span></span>
                    </label>
                  )}
                </LeadForm>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
