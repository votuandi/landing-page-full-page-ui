import { SectionHead } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import type { projects } from "./schema";
import FeaturedProjects from "./t14.client";

export default function ProjectsT14({ data, site, sectionId }: SectionPropsOf<typeof projects>) {
  if (!data.items.length) return null;
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section relative overflow-hidden bg-gradient-to-br from-bg-deep via-bg-tint to-primary-deep text-fg" aria-labelledby={`${sectionId}-title`}>
    <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-pill bg-glow-accent-25" />
    <div className="t15-container relative">
      <SectionHead id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} />
      <FeaturedProjects sectionId={sectionId} locale={site.locale} showFilter={data.showFilter} allLabel={t(data.allLabel)} ctaLabel={t(data.ctaLabel)} savingLabel={t(data.savingLabel)}
        labels={{ household: t(data.segmentLabels.household), shop: t(data.segmentLabels.shop), factory: t(data.segmentLabels.factory), farm: t(data.segmentLabels.farm) }}
        items={data.items.map(({ image, industry, description, ...item }) => ({ ...item,
          imageSrc: mediaSrc(image), imageAlt: t(image.alt), industry: industry && t(industry), description: description && t(description),
        }))} />
    </div>
  </section>;
}
