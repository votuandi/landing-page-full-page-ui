import Image from "next/image";
import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import { T10, T10Head } from "../shared/t10";
import type { services } from "./schema";

/** Services t10 (Solutions): lưới thẻ kính có ảnh 4:3, số thứ tự, mô tả và link khám phá. */
export default function ServicesT10({ data, site, sectionId }: SectionPropsOf<typeof services>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return (
    <section aria-labelledby={`${sectionId}-title`} className="t15-section">
      <div className="t15-container">
        <T10Head id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={data.description && t(data.description)} />
        <div data-reveal-stagger="up" className="grid gap-6 md:grid-cols-3">
          {data.items.map((item, i) => {
            const src = mediaSrc(item.image);
            return (
              <article key={item.id} className={`${T10.card} overflow-hidden`}>
                <div className="relative aspect-[4/3]">
                  {src ? <Image src={src} alt={t(item.image.alt)} fill sizes="(min-width:768px) 33vw, 95vw" className="object-cover" />
                    : <MediaImage alt={t(item.image.alt)} sizes="33vw" />}
                </div>
                <div className="p-6">
                  <p className="text-sm font-bold text-primary-strong">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-fg">{t(item.title)}</h3>
                  {item.points.map((point, j) => <p key={j} className="mt-4 text-sm leading-7 text-fg-muted">{t(point)}</p>)}
                  {item.link && (
                    <SectionLink link={item.link} locale={site.locale} className="mt-5 inline-flex min-h-11 items-center font-bold text-primary">
                      {t(item.link.label)}<span aria-hidden className="ml-2">↗</span>
                    </SectionLink>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
