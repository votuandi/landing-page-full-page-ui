import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { T10Head } from "../shared/t10";
import type { trust } from "./schema";

/** Trust t10: bốn ô cam kết nền sky, tiêu đề + mô tả ngắn (chi tiết chứng nhận để ở variant khác). */
export default function TrustT10({ data, site, sectionId }: SectionPropsOf<typeof trust>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return (
    <section aria-labelledby={`${sectionId}-title`} className="t15-section">
      <div className="t15-container">
        <T10Head id={`${sectionId}-title`} eyebrow={t(data.eyebrow) || undefined} title={t(data.title)} desc={data.description && t(data.description)} />
        <div data-reveal-stagger="up" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.items.map((item) => (
            <article key={item.id} className="rounded-card border border-primary/20 bg-bg-sky/60 p-6">
              <span aria-hidden className="text-2xl text-primary-strong">◇</span>
              <h3 className="mt-3 font-bold text-fg">{t(item.title)}</h3>
              <p className="mt-3 text-xs leading-6 text-fg-muted">{t(item.subtitle)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
