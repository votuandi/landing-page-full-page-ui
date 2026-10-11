import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import type { stats } from "./schema";
import StatsT10Counter from "./t10.client";

/** Stats t10 (Counters): dải primary 4 cột, số đếm khi vào màn hình; `title` là chú thích nhỏ dưới số liệu. */
export default function StatsT10({ data, site, sectionId }: SectionPropsOf<typeof stats>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const year = new Date().getFullYear();
  return (
    <section aria-labelledby={data.eyebrow ? `${sectionId}-title` : undefined} className="bg-primary-strong py-12 text-on-primary">
      <div className="t15-container">
        {data.eyebrow && <h2 id={`${sectionId}-title`} className="sr-only">{t(data.eyebrow)}</h2>}
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {data.items.map((item, i) => (
            <div key={i} className="flex flex-col-reverse">
              <dt className="mt-3 text-sm text-on-primary/80">{t(item.label)}</dt>
              <dd className="text-4xl font-black tracking-tight">
                <StatsT10Counter value={item.value ?? year - item.sinceYear!} decimals={item.decimals} locale={site.locale} />
                {item.suffix && <span className="mt-2 block text-sm font-bold text-accent">{t(item.suffix)}</span>}
              </dd>
            </div>
          ))}
        </dl>
        {data.title && <p className="mt-8 text-xs leading-6 text-on-primary/80">{t(data.title)}</p>}
      </div>
    </section>
  );
}
