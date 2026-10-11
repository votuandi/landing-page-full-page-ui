import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import { toClientLink } from "../shared/links";
import type { hero } from "./schema";
import HeroT10Island from "./t10.client";

/** Hero t10: chọn phân khúc ngay hero (đổi tiêu đề/ảnh, đồng bộ `useSegment()`), ảnh vòm + thẻ kính số liệu. */
export default function HeroT10({ data, site, sectionId }: SectionPropsOf<typeof hero>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const card = data.savingCard ?? data.outputCard;
  const base = {
    title: [data.title.lead, data.title.highlight, data.title.sub, data.title.subHighlight].map(t).filter(Boolean).join(" "),
    description: t(data.description), highlights: (data.highlights ?? []).map(t),
    image: { src: mediaSrc(data.image), alt: t(data.image.alt) }, ctaLabel: t(data.primaryCta.label),
  };
  return <HeroT10Island titleId={`${sectionId}-title`} badge={t(data.badge)} base={base} note={data.note && t(data.note)}
    primary={toClientLink(data.primaryCta, site.locale)} secondary={data.secondaryCta && toClientLink(data.secondaryCta, site.locale)}
    card={card && { label: t(card.label), value: card.value, unit: card.unit && t(card.unit) }}
    picker={data.segmentViews && {
      label: t(data.segmentViews.label),
      items: data.segmentViews.items.map((item) => ({
        segment: item.segment, label: t(item.label), title: t(item.title), description: t(item.description),
        highlights: item.highlights.map(t), image: { src: mediaSrc(item.image), alt: t(item.image.alt) }, ctaLabel: item.ctaLabel ? t(item.ctaLabel) : base.ctaLabel,
      })),
    }} />;
}
