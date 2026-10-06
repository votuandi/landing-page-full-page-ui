"use client";

import { useEffect, useState } from "react";
import { CheckIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useQuoteCart } from "@/lib/quoteCartContext";

/** Thêm sản phẩm vào giỏ yêu cầu báo giá; báo "Đã thêm" ngay trên nút (và cho trình đọc màn hình). */
export default function AddToQuoteButton({ sku, name, className = "", compact = false }: { sku: string; name: string; className?: string; compact?: boolean }) {
  const cart = useQuoteCart();
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <button type="button" onClick={() => { cart.add(sku); setAdded(true); }} aria-label={`Thêm ${name} vào yêu cầu báo giá`}
      className={`t5-button ${added ? "t5-button-accent" : "t5-button-primary"} ${compact ? "!px-4" : ""} ${className}`}>
      {added ? <CheckIcon className="h-4 w-4" strokeWidth={2.5} /> : <PlusIcon className="h-4 w-4" strokeWidth={2.5} />}
      <span aria-live="polite">{added ? "Đã thêm" : compact ? "Báo giá" : "Thêm vào yêu cầu báo giá"}</span>
    </button>
  );
}
