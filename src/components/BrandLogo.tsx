import Image from "next/image";
import { SITE_CONFIG } from "@/config/site";

/**
 * Logo thương hiệu. Nếu config có `brand.logo` thì dùng ảnh đó; nếu không, tự vẽ biểu tượng
 * mặt trời + tấm pin bằng màu của design tokens và ghi tên công ty từ config.
 */
export default function BrandLogo({ name = SITE_CONFIG.brand.name, className = "" }: { name?: string; className?: string }) {
  if (SITE_CONFIG.brand.logo) {
    return <Image src={SITE_CONFIG.brand.logo} alt={name} width={184} height={48} className={`h-11 w-auto ${className}`} priority />;
  }
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg aria-hidden viewBox="0 0 64 64" className="h-10 w-10 shrink-0">
        <rect width="64" height="64" rx="16" className="fill-primary-deep" />
        <circle cx="46" cy="17" r="8" className="fill-sun" />
        <path d="M9 43h46l-7 12H16z" className="fill-on-media" />
        <path d="M17 43 24 24h24l8 19" fill="none" strokeWidth="5" strokeLinejoin="round" className="stroke-on-media" />
        <path d="M22 37h29M28 25l-4 18M40 25l4 18" strokeWidth="2" className="stroke-sun" />
      </svg>
      <span className="text-lg font-black leading-none tracking-[-.03em] text-fg">{name}</span>
    </span>
  );
}
