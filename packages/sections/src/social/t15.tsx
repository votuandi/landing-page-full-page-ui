import { SectionHead, FacebookIcon, YouTubeIcon, TikTokIcon, ZaloIcon } from "@solar/ui";
import { CameraIcon } from "@heroicons/react/24/outline";
import { pickLocale, resolveLink } from "../fields";
import type { SectionPropsOf } from "../define";
import type { social } from "./schema";

const icons = { facebook: FacebookIcon, youtube: YouTubeIcon, tiktok: TikTokIcon, zalo: ZaloIcon, instagram: CameraIcon };
export default function SocialT15({ data, site, sectionId }: SectionPropsOf<typeof social>) {
  const t = (text: { vi: string; en?: string }) => pickLocale(text, site.locale);
  return <section className="t15-section bg-bg-sky" aria-labelledby={sectionId + "-title"}>
    <div className="t15-container grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
      <SectionHead id={sectionId + "-title"} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={data.description && t(data.description)} />
      <ul className="grid grid-cols-2 gap-3 sm:gap-4">{data.channels.map((channel, i) => {
        const Icon = icons[channel.kind];
        const href = typeof channel.url === "string" ? channel.url : resolveLink(channel.url).href;
        return <li key={i}><a href={href} target="_blank" rel="noopener noreferrer" className="t15-card group flex h-full flex-col gap-4 p-5 transition motion-safe:hover:-translate-y-1 sm:p-6">
          <span className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-card bg-primary/15 text-primary"><Icon aria-hidden className="h-6 w-6" /></span><span className="text-xs font-black text-primary">{site.locale === "en" ? "Follow" : "Theo dõi"} ↗</span></span>
          <span>{channel.followers && <span className="block text-3xl font-black tabular-nums text-fg">{channel.followers}</span>}<span className="mt-1 block text-sm font-bold text-fg-muted">{t(channel.label)}{channel.handle && <> · <span className="font-medium">{t(channel.handle)}</span></>}</span></span>
        </a></li>;
      })}</ul>
    </div>
  </section>;
}
