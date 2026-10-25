import { SEGMENT_SLUGS } from "@solar/core";
import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import { T10 } from "../shared/t10";
import type { segments } from "./schema";
import { SegmentLink } from "./t15.island";

// Ba nhịp nền như template-10: sáng (mint → trắng), đậm (primary), sky + mint.
const TONES = [
  { section: "bg-gradient-to-br from-bg-tint to-bg-elevated text-fg", intro: "text-fg-muted", tile: "border-secondary/25 bg-bg-elevated/80 text-fg-muted", value: "text-secondary", cta: T10.primary, detail: "text-primary" },
  { section: "bg-primary text-on-primary", intro: "text-on-primary/85", tile: "border-accent/30 bg-on-primary/10 text-on-primary/90", value: "text-accent", cta: "bg-accent text-on-accent", detail: "text-accent" },
  { section: "bg-bg-sun text-fg", intro: "text-fg-muted", tile: "border-secondary/25 bg-bg-elevated/80 text-fg-muted", value: "text-secondary", cta: T10.primary, detail: "text-primary" },
] as const;
const PHOTO_RADIUS = "calc(var(--radius-card) * 3.5)";

/** Segments t10 (BenefitHeroes): mỗi phân khúc một khối lợi ích toàn màn hình, ảnh xen trái/phải, CTA chọn phân khúc. */
export default function SegmentsT10({ data, site, sectionId }: SectionPropsOf<typeof segments>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return (
    <div>
      {data.items.map((item, i) => {
        const tone = TONES[i % TONES.length];
        const src = mediaSrc(item.image);
        const titleId = `${sectionId}-${item.segment}-title`;
        return (
          <section key={item.segment} aria-labelledby={titleId} className={`relative flex items-center overflow-hidden py-[72px] lg:min-h-svh lg:py-[88px] ${tone.section}`}>
            <div className="t15-container grid items-center gap-9 lg:grid-cols-2 lg:gap-14">
              <div data-reveal="up" className={`relative pb-6 lg:pb-7 ${i % 2 ? "lg:order-2" : ""}`}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-bg-sky lg:aspect-[4/5]"
                  style={i % 2 ? { borderTopRightRadius: PHOTO_RADIUS } : { borderTopLeftRadius: PHOTO_RADIUS }}>
                  {src ? <MediaImage src={src} alt={t(item.image.alt)} focal={item.image.focal} sizes="(min-width:1024px) 48vw, 95vw" className="object-cover" />
                    : <MediaImage alt={t(item.image.alt)} sizes="48vw" />}
                </div>
                {item.tag && (
                  <div className="absolute inset-x-4 bottom-0 flex items-center gap-3 rounded-card border border-glass-border bg-bg-elevated/90 p-[18px] text-sm font-black text-primary shadow-glass backdrop-blur-md">
                    <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-xl text-secondary-deep">✦</span>{t(item.tag)}
                  </div>
                )}
              </div>
              <div data-reveal="up">
                <p className={T10.eyebrow}>{t(item.label)}</p>
                <h2 id={titleId} className="mt-5 text-display-sm font-black leading-[1.14] tracking-[-0.045em] lg:text-5xl">{t(item.pitch)}</h2>
                {item.intro && <p className={`mt-5 text-body leading-[1.9] ${tone.intro}`}>{t(item.intro)}</p>}
                {item.benefits && item.benefits.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3">
                    {item.benefits.map((benefit, j) => (
                      <article key={j} className={`rounded-card border p-3.5 sm:p-[18px] ${tone.tile}`}>
                        <p className={`text-lg font-black tracking-[-0.035em] sm:text-xl ${tone.value}`}>{t(benefit.value)}</p>
                        <h3 className="mt-2 text-sm font-black">{t(benefit.title)}</h3>
                        <p className="mt-2 text-xs leading-6">{t(benefit.text)}</p>
                      </article>
                    ))}
                  </div>
                )}
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  {item.ctaLabel && (
                    <SegmentLink segment={item.segment} anchor={data.targetAnchor} href={`?phan-khuc=${SEGMENT_SLUGS[item.segment]}#${data.targetAnchor}`}
                      className={`${T10.button} ${tone.cta} text-center`}>{t(item.ctaLabel)}<span aria-hidden>↗</span></SegmentLink>
                  )}
                  {item.detailLink && (
                    <SectionLink link={item.detailLink} locale={site.locale} className={`inline-flex min-h-11 items-center gap-2.5 text-body-sm font-black ${tone.detail}`}>
                      {t(item.detailLink.label)}<span aria-hidden>→</span>
                    </SectionLink>
                  )}
                </div>
                <p className={`mt-4 text-xs leading-6 ${tone.intro}`}>{t(data.description)}</p>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
