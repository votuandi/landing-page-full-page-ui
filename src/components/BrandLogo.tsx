import Image from "next/image";
import { SITE_CONFIG } from "@/config/site";

/**
 * Logo thương hiệu. Nếu config có `brand.logo` thì dùng ảnh đó; nếu không, tự vẽ biểu tượng
 * chiếc lá + mặt trời bằng màu của design tokens và ghi tên công ty từ config.
 */
export default function BrandLogo({ name = SITE_CONFIG.brand.name, className = "" }: { name?: string; className?: string }) {
  if (SITE_CONFIG.brand.logo) {
    return <Image src={SITE_CONFIG.brand.logo} alt={name} width={184} height={48} className={`h-11 w-auto ${className}`} priority />;
  }
  const [first, ...rest] = name.split(" ");
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg aria-hidden viewBox="0 0 64 64" className="h-10 w-10 shrink-0">
        <rect width="64" height="64" rx="18" className="fill-primary" />
        <circle cx="44" cy="20" r="9" className="fill-accent" />
        <path d="M13 50c0-17 12-28 31-28-1 18-12 29-31 28Z" className="fill-bg-elevated" />
        <path d="M15 49c7-8 14-13 23-18" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-primary" />
      </svg>
      <span className="text-lg font-black leading-none tracking-[-.03em] text-fg">
        {first}{rest.length > 0 && <span className="text-primary"> {rest.join(" ")}</span>}
      </span>
    </span>
  );
}
