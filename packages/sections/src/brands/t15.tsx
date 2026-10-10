import { SectionHead, Wordmark } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import type { brands } from "./schema";
import SigningVideo from "./t15.client";

export default function BrandsT15({ data, site, sectionId }: SectionPropsOf<typeof brands>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const video = data.signingVideo;
  return <section className="t15-section relative overflow-hidden bg-gradient-to-b from-bg-sky to-bg" aria-labelledby={`${sectionId}-title`}><div className="t15-container">
    <SectionHead id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={data.description && t(data.description)} />
    <div className={`mt-10 grid gap-5 ${video ? "lg:grid-cols-[1.05fr_1fr]" : ""}`}>
      {video && <SigningVideo title={t(video.title)} caption={t(video.caption)} poster={mediaSrc(video.poster)} source={video.source} locale={site.locale} />}
      <div data-reveal-stagger="zoom" data-reveal-step="0.05" className="grid grid-cols-2 gap-3 sm:grid-cols-3">{data.items.map((item, i) => <div key={i} className="t15-card flex min-h-[112px] flex-col items-center justify-center gap-2 p-4 text-center transition hover:border-primary/50"><Wordmark name={t(item.name)} src={mediaSrc(item.logo)} /><span className="text-4xs font-black uppercase tracking-[.16em] text-fg-subtle">{t(data.groups.find((group) => group.id === item.group)!.label)}</span></div>)}</div>
    </div>
  </div></section>;
}
