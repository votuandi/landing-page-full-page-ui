import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import type { ctaBanner } from "./schema";

export default function CtaBannerT15({ data, site, sectionId }: SectionPropsOf<typeof ctaBanner>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-invert relative isolate overflow-hidden bg-bg-tint text-fg" aria-labelledby={`${sectionId}-title`}>
    <MediaImage src={mediaSrc(data.image)} alt={t(data.image.alt)} sizes="100vw" className="-z-10" />
    <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-bg-tint via-bg-tint/90 to-bg-tint/20" />
    <div className="t15-container grid gap-8 py-16 md:py-20 lg:grid-cols-[1.2fr_.8fr] lg:items-center"><div data-reveal="left">
      {data.eyebrow && <span className="t15-eyebrow">{t(data.eyebrow)}</span>}
      <h2 id={`${sectionId}-title`} className="mt-4 max-w-2xl text-4xl font-black tracking-[-.04em] sm:text-5xl">{t(data.title)}</h2>
      <p className="mt-5 max-w-xl leading-7 text-fg-muted">{t(data.description)}</p>
      <div className="mt-8 flex flex-wrap gap-3"><SectionLink link={data.primaryCta} locale={site.locale} className="t15-button t15-button-primary min-h-12 text-base" />{data.secondaryCta && <SectionLink link={data.secondaryCta} locale={site.locale} className="t15-button t15-button-secondary min-h-12 text-base" />}</div>
    </div></div>
  </section>;
}
