import { SectionHead } from "@solar/ui";
import { pickLocale } from "../fields";
import type { SectionPropsOf } from "../define";
import type { services } from "./schema";
import { mediaSrc } from "../shared/media";
import { toClientLink } from "../shared/links";
import Services from "./t15.client";

export default function ServicesT15({ data, site, sectionId }: SectionPropsOf<typeof services>) {
  const t = (text: { vi: string; en?: string }) => pickLocale(text, site.locale);
  return <section className="t15-section relative overflow-hidden bg-bg-tint" aria-labelledby={sectionId + "-title"}>
    <div className="t15-container">
      <SectionHead id={sectionId + "-title"} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={data.description && t(data.description)} />
      <Services sectionId={sectionId} locale={site.locale} items={data.items.map((item) => ({
        id: item.id, title: t(item.title), src: mediaSrc(item.image), alt: t(item.image.alt), points: item.points.map(t),
        link: item.link ? toClientLink(item.link, site.locale) : item.segment ? toClientLink({ kind: "calculator", value: "phan-khuc=" + item.segment, label: data.ctaLabel }, site.locale) : undefined,
      }))} stories={data.videos.map((video, i) => ({
        id: sectionId + "-video-" + i, title: t(video.title), location: video.location ? t(video.location) : "", kwp: 0,
        segment: "household", poster: mediaSrc(video.poster), source: video.source, kindLabel: t(data.eyebrow),
      }))} />
    </div>
  </section>;
}
