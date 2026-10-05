import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  id: number; title: string; description: string; image: string; features: string[]; price: string; href: string;
}

export default function ProductCard({ title, description, image, features, price, href }: ProductCardProps) {
  return (
    <Link href={href} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_16px_45px_rgba(120,75,20,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(120,75,20,0.14)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#fff8ed]">
          <Image src={image} alt={title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width:768px) 100vw, 33vw" />
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-700 backdrop-blur">Minwy selection</span>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-xl font-black leading-snug text-stone-900 transition group-hover:text-orange-600">{title}</h3>
          <p className="mt-3 line-clamp-2 leading-7 text-stone-600">{description}</p>
          <div className="mt-5 flex flex-wrap gap-2">{features.slice(0,3).map(feature=><span key={feature} className="rounded-full bg-[#fff8ed] px-3 py-1 text-xs font-semibold text-stone-600">{feature}</span>)}</div>
          <div className="mt-auto flex items-end justify-between border-t border-orange-100 pt-5">
            <div><span className="text-xs font-bold uppercase tracking-wider text-stone-400">Giá tham khảo</span><div className="mt-1 text-xl font-black text-orange-600">{price}</div></div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-xl text-white transition group-hover:translate-x-1">→</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
