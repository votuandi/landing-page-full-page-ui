import { Wordmark } from "@solar/ui";
import Link from "next/link";
import { normalizeVnPhone } from "@solar/core";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import type { siteHeader } from "./schema";

export default function HeaderMinwy({ data, site }: SectionPropsOf<typeof siteHeader>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  const navigation = <>
    {data.links.map((entry, i) => <SectionLink key={i} link={entry} locale={site.locale} className="inline-flex min-h-11 items-center py-2 font-semibold hover:text-primary" />)}
    {data.menus.map((menu, i) => <details key={i} className="relative"><summary className="flex min-h-11 cursor-pointer items-center font-semibold">{t(menu.label)}</summary><div className="z-30 min-w-60 rounded-card border border-line/15 bg-bg-elevated p-5 shadow-lg lg:absolute lg:right-0">{menu.columns.map((col, n) => <div key={n} className="mb-4 last:mb-0"><p className="font-bold text-primary">{t(col.title)}</p>{col.description && <p className="mt-2 text-sm text-fg-muted">{t(col.description)}</p>}{col.link && <SectionLink link={col.link} locale={site.locale} className="block py-2" />}<ul>{col.links.map((entry, k) => <li key={k}><SectionLink link={entry} locale={site.locale} className="block py-2 text-sm" /></li>)}</ul></div>)}</div></details>)}
  </>;
  return <header className="relative z-30 border-b border-line/15 bg-bg-elevated text-fg">
    {data.topBar.length > 0 && <div className="bg-primary text-on-primary"><div className="t15-container flex flex-wrap justify-between gap-x-8 gap-y-2 py-2 text-xs">{data.topBar.map((entry, i) => <span key={i}>{t(entry)}</span>)}</div></div>}
    <div className="t15-container flex min-h-24 flex-wrap items-center justify-between gap-5 py-4">
      <Link href="/" className="min-w-0 max-w-full"><Wordmark name={data.brand.name} src={mediaSrc(data.brand.logo)} /></Link>
      <nav aria-label={site.locale === "en" ? "Main navigation" : "Điều hướng chính"} className="hidden items-center gap-6 text-sm lg:flex">{navigation}</nav>
      <div className="hidden items-center gap-5 lg:flex">{data.hotlines[0] && <a href={`tel:${normalizeVnPhone(data.hotlines[0].main)}`} className="text-sm font-bold text-primary">{t(data.hotlineLabel)}<br />{data.hotlines[0].main}</a>}<SectionLink link={data.cta} locale={site.locale} className="rounded-button bg-primary px-5 py-3 text-sm font-bold text-on-primary" /></div>
      <details className="w-full lg:hidden"><summary className="flex min-h-11 cursor-pointer items-center justify-between border-t border-line/15 py-3 font-bold">{site.locale === "en" ? "Menu" : "Danh mục"}<span aria-hidden>☰</span></summary><nav aria-label={site.locale === "en" ? "Mobile navigation" : "Điều hướng di động"} className="grid gap-2 pb-4">{navigation}{data.mobileLinks.map((entry, i) => <SectionLink key={i} link={entry} locale={site.locale} className="py-3" />)}{data.drawerActions.map((entry, i) => <SectionLink key={i} link={entry} locale={site.locale} className="rounded-button bg-primary px-5 py-3 font-bold text-on-primary" />)}</nav></details>
    </div>
  </header>;
}
