import { CheckBadgeIcon, ExclamationCircleIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { normalizeVnPhone } from "@solar/core";
import { FacebookIcon, TikTokIcon, YouTubeIcon, ZaloIcon } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { BrandMark } from "../shared/BrandMark";
import { mediaSrc } from "../shared/media";
import type { siteFooter } from "./schema";

const SOCIAL_ICONS = { facebook: FacebookIcon, youtube: YouTubeIcon, tiktok: TikTokIcon, zalo: ZaloIcon } as const;
const tel = (phone: string) => `tel:${normalizeVnPhone(phone)}`;

/** Footer t15 "Ocean Forest": thương hiệu + pháp lý, cửa hàng theo chi nhánh, cột link. Thuần server. */
export default function SiteFooterT15({ data, site }: SectionPropsOf<typeof siteFooter>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const { brand, legal, complaintHotline } = data;
  const en = site.locale === "en";
  const moit = legal.moitBadge.enabled && (
    <span className="inline-flex items-center gap-2.5 rounded-2xl border-2 border-dashed border-line/25 bg-glass px-3 py-2">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-primary"><CheckBadgeIcon aria-hidden className="h-6 w-6" /></span>
      <span className="text-2xs font-black uppercase leading-tight tracking-wide text-fg">
        {en ? "Notified to" : "Đã thông báo"}<br />{en ? "Ministry of Industry & Trade" : "Bộ Công Thương"}
        <span className="block text-5xs font-bold normal-case tracking-normal text-fg-subtle">(placeholder)</span>
      </span>
    </span>
  );

  return (
    <footer className="t15-invert t15-ocean relative overflow-hidden text-fg">
      <div aria-hidden className="t15-energy-line h-1 w-full" />
      <div aria-hidden className="t15-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(180deg,transparent,black_40%,transparent)]" />
      <div className="t15-container relative grid gap-10 py-16 lg:grid-cols-[1.1fr_2fr_.9fr]">
        <div>
          <BrandMark name={brand.name} logoSrc={mediaSrc(brand.logo)} />
          <p className="mt-5 text-sm leading-7 text-fg-muted">{t(brand.tagline)}</p>
          {data.socials.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {data.socials.map((s) => {
                const Icon = SOCIAL_ICONS[s.kind];
                return <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="grid h-11 w-11 place-items-center rounded-full border border-line/15 bg-glass text-fg transition hover:bg-accent hover:text-on-accent"><Icon className="h-5 w-5" /></a>;
              })}
            </div>
          )}
          <div className="mt-6 space-y-2 text-xs leading-6 text-fg-muted">
            {legal.legalName && <p className="font-black text-fg">{legal.legalName}</p>}
            {legal.lines.map((line, i) => <p key={i}>{t(line)}</p>)}
          </div>
          {legal.badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {legal.badges.map((badge) => <span key={badge} className="rounded-full border border-line/20 bg-glass px-3 py-1 text-2xs font-black text-fg">{badge}</span>)}
            </div>
          )}
          {complaintHotline && (
            <a href={tel(complaintHotline.phone)} className="mt-6 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 transition hover:bg-accent/20">
              <ExclamationCircleIcon aria-hidden className="h-6 w-6 shrink-0 text-accent-ink" />
              <span><span className="block text-xs font-bold text-fg-muted">{t(complaintHotline.label)}</span><span className="text-lg font-black tabular-nums text-fg">{complaintHotline.phone}</span></span>
            </a>
          )}
        </div>

        <div>
          {data.branches.length > 0 && <>
            <h2 className="t15-footer-title">{t(data.branchesTitle)}</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {data.branches.map((b) => (
                <div key={b.name}>
                  <div className="flex items-center gap-1.5 text-sm font-black text-fg"><MapPinIcon aria-hidden className="h-4 w-4 text-primary" />{b.name}</div>
                  <ul className="mt-2 space-y-3">
                    {b.stores.map((s) => (
                      <li key={s.name + s.phone} className="text-xs leading-5 text-fg-muted">
                        <div className="font-bold text-fg">{s.name}</div>
                        {s.address && <div>{s.address}</div>}
                        <div className="mt-1 flex items-center gap-2">
                          <a href={tel(s.phone)} className="font-black tabular-nums text-fg hover:text-accent-ink">{s.phone}</a>
                          <a href={`https://zalo.me/${normalizeVnPhone(s.phone)}`} target="_blank" rel="noopener noreferrer" aria-label={`Zalo ${s.phone}`} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-primary/20 px-2.5 text-2xs font-black text-fg hover:bg-primary hover:text-on-primary">
                            <ZaloIcon className="h-3.5 w-3.5" />Zalo
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>}
        </div>

        <div className="grid content-start gap-8 sm:grid-cols-3 lg:grid-cols-1">
          {data.columns.map((col, i) => (
            <div key={i}>
              <h2 className="t15-footer-title">{t(col.title)}</h2>
              <ul className="mt-5 space-y-3 text-sm text-fg-muted">
                {col.links.map((l, li) => <li key={li}><SectionLink link={l} locale={site.locale} className="hover:text-fg" /></li>)}
              </ul>
              {i === data.columns.length - 1 && <p className="mt-5 whitespace-pre-line text-xs text-fg-muted">{t(data.contactNote)}</p>}
            </div>
          ))}
          {legal.moitBadge.url ? <a href={legal.moitBadge.url} target="_blank" rel="noopener noreferrer">{moit}</a> : moit}
        </div>
      </div>
      <div className="relative border-t border-line/12">
        <div className="t15-container flex flex-col gap-2 py-5 pb-28 text-xs text-fg-muted md:flex-row md:justify-between lg:pb-5">
          <span>© {new Date().getFullYear()} {brand.name}.{data.disclaimer[0] && <> {t(data.disclaimer[0])}</>}</span>
          {data.disclaimer.slice(1).map((line, i) => <span key={i}>{t(line)}</span>)}
        </div>
      </div>
    </footer>
  );
}
