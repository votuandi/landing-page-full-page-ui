import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { T10Head } from "../shared/t10";
import type { process } from "./schema";

/** Process t10: lưới 3 cột, mỗi bước có vạch trên, số tròn primary, tiêu đề + mô tả. */
export default function ProcessT10({ data, site, sectionId }: SectionPropsOf<typeof process>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return (
    <section aria-labelledby={`${sectionId}-title`} className="t15-section bg-bg-elevated">
      <div className="t15-container">
        <T10Head id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} />
        <ol data-reveal-stagger="up" className="grid gap-6 md:grid-cols-3">
          {data.steps.map((step, i) => (
            <li key={i} className="relative border-t-2 border-primary/20 pt-6">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-strong font-black text-on-primary">{i + 1}</span>
              <h3 className="mt-5 text-xl font-bold text-fg">{t(step.title)}</h3>
              <p className="mt-3 text-sm leading-7 text-fg-muted">{t(step.description)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
