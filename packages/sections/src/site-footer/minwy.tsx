import { MediaImage } from "@solar/ui";
import { normalizeVnPhone } from "@solar/core";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import type { siteFooter } from "./schema";

export default function FooterMinwy({ data, site }: SectionPropsOf<typeof siteFooter>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <footer className="bg-primary-deep text-on-media"><div className="t15-container grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
    <div>{data.brand.logo && <div className="relative mb-5 h-16 w-40"><MediaImage src={mediaSrc(data.brand.logo)} alt={data.brand.name} sizes="160px" className="!object-contain" /></div>}<p className="text-xl font-bold">{data.brand.name}</p><p className="mt-4 text-sm leading-7">{t(data.brand.tagline)}</p><div className="mt-6 space-y-2 text-xs leading-6"><p className="font-bold">{data.legal.legalName}</p>{data.legal.lines.map((line, i) => <p key={i}>{t(line)}</p>)}</div><ul className="mt-5 flex flex-wrap gap-4">{data.socials.map((entry) => <li key={entry.url}><a href={entry.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline">{entry.label}</a></li>)}</ul></div>
    {data.columns.map((col, i) => <div key={i}><h2 className="text-lg font-bold">{t(col.title)}</h2><ul className="mt-5 space-y-2 text-sm">{col.links.map((entry, n) => <li key={n}><SectionLink link={entry} locale={site.locale} className="inline-flex min-h-11 items-center hover:underline" /></li>)}</ul></div>)}
    {data.branches.length > 0 && <div><h2 className="text-lg font-bold">{t(data.branchesTitle)}</h2>{data.branches.map((branch, i) => <div key={i} className="mt-5 text-sm leading-7"><p className="font-bold">{branch.name}</p>{branch.stores.map((store, n) => <div key={n} className="mt-3"><p>{store.name}</p>{store.address && <p>{store.address}</p>}<a href={`tel:${normalizeVnPhone(store.phone)}`} className="inline-flex min-h-11 items-center font-bold">{store.phone}</a></div>)}</div>)}<p className="mt-4 whitespace-pre-line text-xs leading-7">{t(data.contactNote)}</p></div>}
  </div><div className="border-t border-on-media/20"><div className="t15-container py-5 text-xs leading-7"><p>© {new Date().getFullYear()} {data.brand.name}</p>{data.disclaimer.map((entry, i) => <p key={i}>{t(entry)}</p>)}</div></div></footer>;
}
