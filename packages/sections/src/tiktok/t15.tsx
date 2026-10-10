import { SectionHead, TikTokIcon } from "@solar/ui";
import { pickLocale } from "../fields";
import type { SectionPropsOf } from "../define";
import type { tiktok } from "./schema";
import { mediaSrc } from "../shared/media";
import TikTok from "./t15.client";

export default function TikTokT15({ data, site, sectionId }: SectionPropsOf<typeof tiktok>) {
  const t = (text: { vi: string; en?: string }) => pickLocale(text, site.locale);
  return <section className="t15-section relative overflow-hidden bg-bg-elevated" aria-labelledby={sectionId + "-title"}>
    <div className="t15-container">
      <SectionHead id={sectionId + "-title"} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={data.description && t(data.description)}
        action={data.profile && <a href={data.profile.url} target="_blank" rel="noopener noreferrer" className="t15-chip"><TikTokIcon aria-hidden className="h-4 w-4" />{t(data.profile.handle)}</a>} />
      <TikTok locale={site.locale} stories={data.videos.map((video) => ({
        id: video.id, title: t(video.title), location: t(video.creator), kwp: 0, segment: video.segment ?? "household",
        quote: video.segment !== undefined, poster: mediaSrc(video.poster), source: video.source, kindLabel: "TikTok",
      }))} />
    </div>
  </section>;
}
