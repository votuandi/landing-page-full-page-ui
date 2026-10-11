import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { T10Head, T10_UI } from "../shared/t10";
import type { testimonials } from "./schema";
import Reviews from "./t10.client";

/** Testimonials t10 (Reviews): lọc theo phân khúc, một nhận xét lớn trong thẻ kính, nút trước/sau. */
export default function TestimonialsT10({ data, site, sectionId }: SectionPropsOf<typeof testimonials>) {
  if (!data.items.length) return null;
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return (
    <section aria-labelledby={`${sectionId}-title`} className="t15-section">
      <div className="t15-container">
        <T10Head id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} className="mb-7" />
        <Reviews ui={T10_UI[site.locale]} items={data.items}
          labels={{ household: t(data.segmentLabels.household), shop: t(data.segmentLabels.shop), factory: t(data.segmentLabels.factory), farm: t(data.segmentLabels.farm) }} />
      </div>
    </section>
  );
}
