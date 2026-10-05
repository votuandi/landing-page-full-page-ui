import Image from "next/image";
import Link from "next/link";

interface WarmPageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export default function WarmPageHero({
  eyebrow,
  title,
  description,
  image,
  primaryLabel = "Nhận tư vấn",
  primaryHref = "/contact-us",
  secondaryLabel,
  secondaryHref,
}: WarmPageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#f5ead7]">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-300/30 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-orange-300/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-[520px] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div>
          <span className="inline-flex rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-700">
            {eyebrow}
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-stone-900 md:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 md:text-xl">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="rounded-full bg-orange-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-700"
            >
              {primaryLabel}
            </Link>
            {secondaryLabel && secondaryHref && (
              <Link
                href={secondaryHref}
                className="rounded-full border border-orange-200 bg-white px-6 py-3.5 font-bold text-stone-800 transition hover:-translate-y-0.5 hover:bg-orange-50"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-5 -top-5 h-full w-full rounded-[2rem] border border-orange-300/60" />
          <div className="relative overflow-hidden rounded-[2rem] border-8 border-white bg-white shadow-2xl shadow-orange-950/10">
            <div className="relative aspect-[5/4]">
              <Image
                src={image}
                alt={title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 52vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
