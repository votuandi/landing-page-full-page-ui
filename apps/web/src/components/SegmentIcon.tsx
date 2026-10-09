import { BuildingOffice2Icon, BuildingStorefrontIcon, HomeModernIcon } from "@heroicons/react/24/outline";
import type { Segment } from "@solar/core";

/** Chuồng trại mái pin (heroicons không có icon trang trại) — cùng nét 1.5 với bộ outline. */
function FarmIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2.5 10.5 12 4l9.5 6.5" />
      <path d="M4.5 9.2V20h15V9.2" />
      <path d="M9 20v-5.5h6V20" />
      <path d="M9 14.5 15 20M15 14.5 9 20" />
      <path d="M6.5 7.8 9.6 5.7M14.4 5.7l3.1 2.1" />
    </svg>
  );
}

const ICONS = {
  household: HomeModernIcon,
  shop: BuildingStorefrontIcon,
  factory: BuildingOffice2Icon,
  farm: FarmIcon,
} as const;

export default function SegmentIcon({ segment, className = "h-6 w-6" }: { segment: Segment; className?: string }) {
  const Icon = ICONS[segment];
  return <Icon className={className} aria-hidden />;
}
