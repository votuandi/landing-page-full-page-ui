import { SectionHead } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import type { shorts } from "./schema";
import Shorts from "./t15.client";

export default function ShortsT15({ data, site, sectionId }: SectionPropsOf<typeof shorts>) {
  if (!data.items.length) return null;
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section relative overflow-hidden bg-bg-sky" aria-labelledby={`${sectionId}-title`}>
    <div aria-hidden className="t15-dots pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(180deg,black,transparent_70%)]" />
    <div className="t15-container relative"><SectionHead id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={data.description && t(data.description)} />
      <Shorts items={data.items.map(({ poster, kind, ...story }) => ({ ...story, poster: mediaSrc(poster), kindLabel: t(data.kindLabels[kind]) }))}
        labels={{ household: t(data.segmentLabels.household), shop: t(data.segmentLabels.shop), factory: t(data.segmentLabels.factory), farm: t(data.segmentLabels.farm) }} locale={site.locale} ctaLabel={t(data.ctaLabel)} />
    </div>
  </section>;
}
