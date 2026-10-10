import Image from "next/image";

/** Logo thương hiệu: ảnh nếu có, không thì biểu tượng lá + mặt trời vẽ bằng token và tên công ty (từ đầu tiên đậm). */
export function BrandMark({ name, logoSrc }: { name: string; logoSrc?: string }) {
  if (logoSrc) return <Image src={logoSrc} alt={name} width={184} height={48} className="h-11 w-auto" priority />;
  const [first, ...rest] = name.split(" ");
  return (
    <span className="flex items-center gap-2.5">
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
