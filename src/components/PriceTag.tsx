import { resolvePrice } from "@/lib/price";
import { formatMoney } from "@/utils/solar";

/** Hiển thị giá; giá khuyến mãi chỉ hiện khi salePrice < price. */
export default function PriceTag({ price, salePrice, quoteOnly, className = "text-lg" }: { price?: number; salePrice?: number; quoteOnly?: boolean; className?: string }) {
  const { current, original } = resolvePrice(price, salePrice);
  if (quoteOnly || !current) return <div className={`font-black text-primary ${className}`}>Liên hệ báo giá</div>;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-black text-fg ${className}`}>{formatMoney(current)}</span>
      {original && <><s className="text-sm text-fg-subtle">{formatMoney(original)}</s><span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-black text-on-accent">-{Math.round((1 - current / original) * 100)}%</span></>}
    </div>
  );
}
