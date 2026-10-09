"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { catalogEnabled } from "@/config/site";
import { productBySlug } from "@/data/products";
import { addItem, clearCart, countItems, removeItem, sanitizeCart, setQty, type CartLine } from "@/lib/quoteCart";
import { STORAGE_KEYS, readJson, writeJson } from "@/lib/storage";

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
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    setLines(sanitizeCart(readJson(STORAGE_KEYS.quoteCart, []), (sku) => Boolean(productBySlug(sku))));
    setLoaded(true);
  }, []);

  useEffect(() => { if (loaded) writeJson(STORAGE_KEYS.quoteCart, lines); }, [lines, loaded]);

  const add = useCallback((sku: string, qty = 1) => setLines((l) => addItem(l, sku, qty)), []);
  const update = useCallback((sku: string, qty: number) => setLines((l) => setQty(l, sku, qty)), []);
  const remove = useCallback((sku: string) => setLines((l) => removeItem(l, sku)), []);
  const clear = useCallback(() => setLines(clearCart()), []);
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
