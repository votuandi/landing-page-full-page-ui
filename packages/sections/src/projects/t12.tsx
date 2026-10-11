import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import type { projects } from "./schema";
import Projects from "./t12.client";

export default function ProjectsT12({ data, site, sectionId }: SectionPropsOf<typeof projects>) {
  if (!data.items.length) return null;
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="relative bg-bg-tint pb-10 text-fg" aria-labelledby={`${sectionId}-title`}>
    <Projects titleId={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)}
      items={data.items.map(({ image, ...item }) => ({ ...item, imageSrc: mediaSrc(image), imageAlt: t(image.alt) }))}
      labels={{ household: t(data.segmentLabels.household), shop: t(data.segmentLabels.shop), factory: t(data.segmentLabels.factory), farm: t(data.segmentLabels.farm) }}
      showFilter={data.showFilter} savingLabel={t(data.savingLabel)} allLabel={t(data.allLabel)} ctaLabel={t(data.ctaLabel)} locale={site.locale} />
  </section>;
}
