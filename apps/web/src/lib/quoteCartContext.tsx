"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { catalogEnabled } from "@/config/site";
import { productBySlug } from "@/data/products";
import { addToQuoteCart, clearCart, countItems, removeItem, sanitizeCart, setQty, readQuoteCart, writeQuoteCart, onQuoteCartChange, onOpenQuoteCart, type CartLine } from "@solar/core";

// Drawer chỉ tải khi mở lần đầu
const QuoteCartDrawer = dynamic(() => import("@/components/QuoteCartDrawer"), { ssr: false });

type QuoteCartApi = {
  /** Dòng giỏ: `sku` = slug sản phẩm trong data/products.ts */
  lines: CartLine[];
  count: number;
  add: (sku: string, qty?: number) => void;
  setQty: (sku: string, qty: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

const Ctx = createContext<QuoteCartApi | null>(null);

/** Giỏ yêu cầu báo giá (không thanh toán): lưu localStorage (bọc try/catch, có fallback bộ nhớ), drawer bên phải. */
export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setLines(sanitizeCart(readQuoteCart(), (sku) => Boolean(productBySlug(sku))));
    refresh();
    const stopChange = onQuoteCartChange(refresh);
    const stopOpen = onOpenQuoteCart(() => setOpen(true));
    return () => { stopChange(); stopOpen(); };
  }, []);

  const add = useCallback((sku: string, qty = 1) => addToQuoteCart(sku, qty), []);
  const update = useCallback((sku: string, qty: number) => writeQuoteCart(setQty(readQuoteCart(), sku, qty)), []);
  const remove = useCallback((sku: string) => writeQuoteCart(removeItem(readQuoteCart(), sku)), []);
  const clear = useCallback(() => writeQuoteCart(clearCart()), []);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  const api = useMemo(() => ({ lines, count: countItems(lines), add, setQty: update, remove, clear, open, close }), [lines, add, update, remove, clear, open, close]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {catalogEnabled && isOpen && <QuoteCartDrawer onClose={close} />}
    </Ctx.Provider>
  );
}

export function useQuoteCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useQuoteCart phải nằm trong QuoteCartProvider");
  return ctx;
}
