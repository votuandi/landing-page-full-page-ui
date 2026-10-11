import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import type { projects } from "./schema";
import Evidence from "./t11.client";

export default function ProjectsT11({ data, site, sectionId }: SectionPropsOf<typeof projects>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <section className="bg-bg-tint py-section text-fg" aria-labelledby={`${sectionId}-title`}><div className="mx-auto max-w-[var(--container)] px-7">
    <p className="text-xs font-semibold uppercase tracking-widest text-primary">04 · {t(data.eyebrow)}</p><h2 id={`${sectionId}-title`} className="mt-4 max-w-3xl font-display text-3xl font-semibold sm:text-4xl">{t(data.title)}</h2>
    <Evidence data={data} items={data.items.map(({ image, ...item }) => ({ ...item, imageSrc: mediaSrc(image), imageAlt: t(image.alt) }))} locale={site.locale} />
  </div></section>;
}
