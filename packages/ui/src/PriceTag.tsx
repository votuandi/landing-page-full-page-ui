import { priceView, formatMoneyShort, formatVnd } from "@solar/core";

type Props = { price?: number; salePrice?: number; short?: boolean; className?: string };

/** Giá theo quy tắc chung (lib/price.ts): giá giảm chỉ khi salePrice < price, nhãn "Giảm Y%" chỉ khi Y ≥ 5, không giá → "Liên hệ". */
export function PriceTag({ price, salePrice, short = false, className = "text-lg" }: Props) {
  const view = priceView(price, salePrice);
  if (view.kind === "contact") return <div className={`font-black text-primary ${className}`}>Liên hệ</div>;
  const fmt = short ? formatMoneyShort : formatVnd;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={`font-black text-fg ${className}`}>{fmt(view.current)}</span>
      {view.original && <s className="text-sm text-fg-subtle"><span className="sr-only">Giá gốc </span>{fmt(view.original)}</s>}
      {view.badge && <span className="rounded-full bg-primary px-2 py-0.5 text-2xs font-black text-on-primary">Giảm {view.badge}%</span>}
    </div>
  );
}
