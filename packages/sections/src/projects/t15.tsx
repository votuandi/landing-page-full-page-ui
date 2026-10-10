import { SectionHead } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import type { projects } from "./schema";
import Projects from "./t15.client";

export default function ProjectsT15({ data, site, sectionId }: SectionPropsOf<typeof projects>) {
  if (!data.items.length) return null;
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section relative overflow-hidden bg-bg-tint" aria-labelledby={`${sectionId}-title`}>
    <div aria-hidden className="pointer-events-none absolute -right-40 top-0 h-[480px] w-[480px] rounded-full bg-glow-sky-20" />
    <div className="t15-container relative"><SectionHead id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} />
      <Projects items={data.items.map(({ image, ...item }) => ({ ...item, imageSrc: mediaSrc(image), imageAlt: t(image.alt) }))}
        labels={{ household: t(data.segmentLabels.household), shop: t(data.segmentLabels.shop), factory: t(data.segmentLabels.factory), farm: t(data.segmentLabels.farm) }} showFilter={data.showFilter} savingLabel={t(data.savingLabel)} allLabel={t(data.allLabel)} ctaLabel={t(data.ctaLabel)} locale={site.locale} />
    </div>
  </section>;
}
