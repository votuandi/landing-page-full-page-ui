import { SparklesIcon } from "@heroicons/react/24/outline";
import { formatNumber } from "@solar/core";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import type { packages } from "./schema";
import Packages from "./t15.client";

/** Gói giải pháp t15 theo phân khúc. Chuỗi đã chọn ngôn ngữ ở server; island giữ tab đang chọn. */
export default function PackagesT15({ data, site, sectionId }: SectionPropsOf<typeof packages>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const titleId = `${sectionId}-title`;
  return (
    <section aria-labelledby={titleId} className="t15-section relative overflow-hidden bg-bg">
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 h-[520px] w-[520px] rounded-full bg-glow-leaf-16" />
      <div className="t15-container relative">
        <Packages
          head={(
            <div data-reveal="down" className="max-w-3xl">
              <span className="t15-eyebrow"><SparklesIcon aria-hidden className="h-4 w-4" />{t(data.eyebrow)}</span>
              <h2 id={titleId} className="t15-heading">{t(data.title)}</h2>
            </div>
          )}
          defaultSegment={data.defaultSegment}
          maxPerSegment={data.maxPerSegment}
          tabs={data.segments.map((s) => ({
            segment: s.segment, label: t(s.label), short: t(s.short), pitch: t(s.pitch),
            cover: { src: mediaSrc(s.cover), alt: t(s.cover.alt) },
          }))}
          items={data.items.map((item) => ({
            id: item.id, segment: item.segment, name: t(item.name), kwp: item.kwp, price: item.price, salePrice: item.salePrice,
            // Nhu cầu gửi kèm lead luôn bằng tiếng Việt.
            topic: `${item.name.vi} (${formatNumber(item.kwp, 1)} kWp)`,
            suitableFor: t(item.suitableFor), highlights: item.highlights.map(t), popular: item.popular, monthlySaving: item.monthlySaving,
          }))}
          text={{
            cta: t(data.ctaLabel), saving: t(data.savingLabel), popular: t(data.popularLabel),
            month: site.locale === "en" ? "month" : "tháng", group: t(data.eyebrow),
          }}
        />
        <p className="mt-5 text-xs text-fg-subtle">{t(data.footnote)}</p>
      </div>
    </section>
  );
}
