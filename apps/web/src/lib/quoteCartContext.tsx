"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { catalogEnabled } from "@/config/site";
import { productBySlug } from "@/data/products";
import { addToQuoteCart, clearCart, countItems, removeItem, sanitizeCart, setQty, readQuoteCart, writeQuoteCart, onQuoteCartChange, onOpenQuoteCart, openQuoteCart, type CartLine } from "@solar/core";

// Drawer chỉ tải khi mở lần đầu
const QuoteCartDrawer = dynamic(() => import("@/components/QuoteCartDrawer"), { ssr: false });

type QuoteCartApi = {
  /** SKU là slug sản phẩm published của site; legacy dùng catalog t15. */
  lines: CartLine[];
  count: number;
  enabled: boolean;
  add: (sku: string, qty?: number) => void;
  setQty: (sku: string, qty: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

const Ctx = createContext<QuoteCartApi | null>(null);

/** Giỏ yêu cầu báo giá (không thanh toán): lưu localStorage (bọc try/catch, có fallback bộ nhớ), drawer bên phải. */
export function QuoteCartProvider({ children, showDrawer = true, validSkus, enabled = catalogEnabled }: { children: React.ReactNode; showDrawer?: boolean; validSkus?: string[]; enabled?: boolean }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const valid = useMemo(() => validSkus ? new Set(validSkus) : null, [validSkus]);
  const accepts = useCallback((sku: string) => enabled && (valid ? valid.has(sku) : Boolean(productBySlug(sku))), [enabled, valid]);

  useEffect(() => {
    const refresh = () => setLines(sanitizeCart(readQuoteCart(), accepts));
    refresh();
    const stopChange = onQuoteCartChange(refresh);
    const stopOpen = onOpenQuoteCart(() => setOpen(true));
    return () => { stopChange(); stopOpen(); };
  }, [accepts]);

  const add = useCallback((sku: string, qty = 1) => { if (accepts(sku)) addToQuoteCart(sku, qty); }, [accepts]);
  const update = useCallback((sku: string, qty: number) => writeQuoteCart(setQty(readQuoteCart(), sku, qty)), []);
  const remove = useCallback((sku: string) => writeQuoteCart(removeItem(readQuoteCart(), sku)), []);
  const clear = useCallback(() => writeQuoteCart(clearCart()), []);
  const open = useCallback(() => openQuoteCart(), []);
  const close = useCallback(() => setOpen(false), []);

  const api = useMemo(() => ({ lines, count: countItems(lines), enabled, add, setQty: update, remove, clear, open, close }), [lines, enabled, add, update, remove, clear, open, close]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {showDrawer && catalogEnabled && isOpen && <QuoteCartDrawer onClose={close} />}
    </Ctx.Provider>
  );
}

export function useQuoteCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useQuoteCart phải nằm trong QuoteCartProvider");
  return ctx;
}
