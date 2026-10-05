import Image from "next/image";
import Link from "next/link";

interface WarmPageHeroProps { eyebrow: string; title: string; description: string; image: string; primaryLabel?: string; primaryHref?: string; secondaryLabel?: string; secondaryHref?: string; }

export default function WarmPageHero({ eyebrow, title, description, image, primaryLabel = "Nhận tư vấn", primaryHref = "/contact-us", secondaryLabel, secondaryHref }: WarmPageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#eef4ef]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(18,55,42,0.06),transparent_45%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-20 lg:min-h-[560px] lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div><span className="inline-flex rounded-md border border-emerald-900/15 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1B5E45]">{eyebrow}</span><h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.035em] text-[#10271f] md:text-6xl">{title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{description}</p><div className="mt-8 flex flex-wrap gap-3"><Link href={primaryHref} className="rounded-xl bg-[#12372A] px-6 py-3.5 font-bold text-white transition hover:bg-[#1B5E45]">{primaryLabel}</Link>{secondaryLabel&&secondaryHref&&<Link href={secondaryHref} className="rounded-xl border border-emerald-950/15 bg-white px-6 py-3.5 font-bold text-[#12372A] hover:bg-emerald-50">{secondaryLabel}</Link>}</div></div>
        <div className="relative"><div className="absolute -inset-4 translate-x-5 translate-y-5 border border-[#1B5E45]/20" /><div className="relative overflow-hidden border border-emerald-950/10 bg-white p-2"><div className="relative aspect-[5/4] overflow-hidden"><Image src={image} alt={title} fill priority className="object-cover" sizes="(max-width:1024px) 100vw, 52vw" /></div></div><div className="absolute -bottom-5 left-5 bg-[#C9E265] px-5 py-4 text-[#12372A] shadow-lg"><div className="text-xs font-black uppercase tracking-[0.14em]">Engineering first</div><div className="mt-1 text-sm font-bold">Khảo sát kỹ • cấu hình đúng • vận hành bền</div></div></div>
      </div>
    </section>
  );
}
