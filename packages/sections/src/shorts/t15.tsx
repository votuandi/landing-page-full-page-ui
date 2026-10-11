import { FacebookIcon, SectionHead, TikTokIcon, YouTubeIcon } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import type { shorts } from "./schema";
import Shorts from "./t15.client";

const CHANNEL_ICONS = { tiktok: TikTokIcon, youtube: YouTubeIcon, facebook: FacebookIcon } as const;

export default function ShortsT15({ data, site, sectionId }: SectionPropsOf<typeof shorts>) {
  if (!data.items.length) return null;
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section relative overflow-hidden bg-bg-sky" aria-labelledby={`${sectionId}-title`}>
    <div aria-hidden className="t15-dots pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(180deg,black,transparent_70%)]" />
    <div className="t15-container relative"><SectionHead id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={data.description && t(data.description)}
      action={data.channels.length > 0 && <div className="flex flex-wrap gap-2">{data.channels.map(({ kind, url, label }) => {
        const Icon = CHANNEL_ICONS[kind];
        return <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="t15-chip"><Icon className="h-4 w-4" />{label}</a>;
      })}</div>} />
      <Shorts items={data.items.map(({ poster, kind, ...story }) => ({ ...story, poster: mediaSrc(poster), kindLabel: t(data.kindLabels[kind]) }))}
        labels={{ household: t(data.segmentLabels.household), shop: t(data.segmentLabels.shop), factory: t(data.segmentLabels.factory), farm: t(data.segmentLabels.farm) }} locale={site.locale} ctaLabel={t(data.ctaLabel)} />
    </div>
  </section>;
}
