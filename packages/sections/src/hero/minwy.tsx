import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import ClassicCarousel from "../shared/ClassicCarousel.client";
import type { hero } from "./schema";

export default function HeroMinwy({ data, site, sectionId }: SectionPropsOf<typeof hero>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  const slides = data.slides ?? [{ badge: data.badge, title: { vi: Object.values(data.title).map((v) => v.vi).join(" "), en: Object.values(data.title).map((v) => v.en ?? v.vi).join(" ") }, description: data.description, image: data.image, cta: data.primaryCta }];
  return <section aria-labelledby={`${sectionId}-title`} className="bg-bg">
    <ClassicCarousel label={t(data.badge)} locale={site.locale} autoplay>
      {slides.map((slide, i) => <div key={i} className="relative isolate flex min-h-[calc(100svh-7.5rem)] w-full shrink-0 snap-start items-center bg-scrim text-on-media">
        <MediaImage src={mediaSrc(slide.image)} alt={t(slide.image.alt)} priority={i === 0} sizes="100vw" />
        <div className="absolute inset-0 bg-scrim/60" />
        <div className="t15-container relative py-20"><div className="max-w-3xl">
          {slide.badge && <p className="mb-4 font-semibold uppercase tracking-widest text-on-media">{t(slide.badge)}</p>}
          {i === 0 ? <h1 id={`${sectionId}-title`} className="text-4xl font-bold tracking-tight md:text-6xl">{t(slide.title)}</h1> : <h2 className="text-4xl font-bold tracking-tight md:text-6xl">{t(slide.title)}</h2>}
          <p className="mt-6 max-w-2xl text-lg leading-8">{t(slide.description)}</p>
          <div className="mt-8 flex flex-wrap gap-4"><SectionLink link={slide.cta ?? data.primaryCta} locale={site.locale} className="rounded-button bg-accent px-7 py-3 font-semibold text-on-accent" />{data.secondaryCta && <SectionLink link={data.secondaryCta} locale={site.locale} className="rounded-button border border-on-media/60 px-7 py-3 font-semibold text-on-media" />}</div>
        </div></div>
      </div>)}
    </ClassicCarousel>
  </section>;
}
