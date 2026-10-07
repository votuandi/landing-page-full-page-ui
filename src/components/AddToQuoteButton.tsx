"use client";

import { useEffect, useState } from "react";
import { CheckIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useQuoteCart } from "@/lib/quoteCartContext";
import { useLang } from "@/i18n/LangProvider";

/** Thêm sản phẩm vào giỏ yêu cầu báo giá; báo "Đã thêm" ngay trên nút (và cho trình đọc màn hình). `sku` = slug sản phẩm. */
export default function AddToQuoteButton({ sku, name, className = "", compact = false, openCart = false }: { sku: string; name: string; className?: string; compact?: boolean; openCart?: boolean }) {
  const { tr } = useLang();
  const cart = useQuoteCart();
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <button type="button" onClick={() => { cart.add(sku); setAdded(true); if (openCart) cart.open(); }}
      className={`t15-button ${added ? "t15-button-accent" : "t15-button-primary"} ${compact ? "!px-4" : ""} ${className}`}>
      {added ? <CheckIcon className="h-4 w-4" strokeWidth={2.5} /> : <PlusIcon className="h-4 w-4" strokeWidth={2.5} />}
      <span aria-live="polite">{added ? tr("Đã thêm", "Added") : compact ? tr("Báo giá", "Quote") : tr("Thêm vào yêu cầu báo giá", "Add to quote request")}</span>
      <span className="sr-only">{compact && !added ? `: ${tr("thêm", "add")}` : ":"} {name}{compact && !added ? ` ${tr("vào yêu cầu báo giá", "to quote request")}` : ""}</span>
    </button>
  );
}
