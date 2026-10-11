import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import type { ctaBanner } from "./schema";

export default function CtaBannerT02({ data, site, sectionId }: SectionPropsOf<typeof ctaBanner>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <section aria-labelledby={`${sectionId}-title`} className="bg-accent py-14 text-on-accent"><div className="t15-container flex flex-col justify-between gap-8 md:flex-row md:items-center">
    <div>{data.eyebrow && <p className="text-xs font-bold uppercase tracking-widest">{t(data.eyebrow)}</p>}<h2 id={`${sectionId}-title`} className="mt-4 max-w-3xl text-3xl font-bold md:text-4xl">{t(data.title)}</h2>{t(data.description) && <p className="mt-4 max-w-2xl leading-7">{t(data.description)}</p>}</div>
    <div className="flex shrink-0 flex-wrap gap-3"><SectionLink link={data.primaryCta} locale={site.locale} className="rounded-button bg-primary px-6 py-4 font-bold text-on-primary" />{data.secondaryCta && <SectionLink link={data.secondaryCta} locale={site.locale} className="rounded-button border border-current px-6 py-4 font-bold" />}</div>
  </div></section>;
}
