import { ArrowTopRightOnSquareIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import type { trust } from "./schema";

export default function TrustT11({ data, site, sectionId }: SectionPropsOf<typeof trust>) {
  const en = site.locale === "en", t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  const licenses = data.items.filter((item) => item.lookupUrl);
  return <section className="bg-bg py-section text-fg" aria-labelledby={`${sectionId}-title`}><div className="mx-auto max-w-[var(--container)] px-7">
    <p className="text-xs font-semibold uppercase tracking-widest text-primary">05 · {t(data.eyebrow)}</p><h2 id={`${sectionId}-title`} className="mt-4 max-w-3xl font-display text-3xl font-semibold sm:text-4xl">{t(data.title)}</h2>{data.description && <p className="mt-4 max-w-3xl leading-8 text-fg-muted">{t(data.description)}</p>}
    {licenses.length ? <div className="mt-8 grid gap-4 md:grid-cols-2">{licenses.map((item) => <a key={item.id} href={item.lookupUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-16 items-center gap-4 rounded-card border border-line bg-bg-elevated p-5 text-primary shadow-sm">{item.image ? <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-media"><MediaImage src={mediaSrc(item.image)} alt={t(item.image.alt)} sizes="96px" /></div> : <ShieldCheckIcon aria-hidden className="h-7 w-7 shrink-0" />}<span className="flex-1 font-semibold">{t(item.title)}</span><ArrowTopRightOnSquareIcon aria-hidden className="h-5 w-5 shrink-0" /></a>)}</div> : <p className="mt-8 rounded-card border border-line bg-bg-tint p-5 text-sm text-fg-muted">{en ? "No company lookup links have been provided. Supply verified records before publishing." : "Chưa có link hồ sơ doanh nghiệp để tra cứu. Chủ website cần cung cấp hồ sơ thực trước khi xuất bản."}</p>}
    <div className="mt-9 grid gap-8 lg:grid-cols-[.7fr_1.3fr]"><div><h3 className="font-display text-xl font-semibold">{en ? "Legal information" : "Pháp lý cần biết"}</h3><p className="mt-3 text-sm leading-7 text-fg-muted">{en ? "Confirm current requirements with qualified professionals and the utility. Savings do not determine legal eligibility." : "Xác nhận với đơn vị chuyên môn và điện lực tại thời điểm triển khai; không suy ra điều kiện áp dụng từ phép tính tiết kiệm."}</p></div><div>
      {data.items.map((item) => <details key={item.id} className="border-b border-line py-3"><summary className="min-h-11 cursor-pointer font-semibold">{t(item.title)}</summary><p className="text-sm text-fg-muted">{t(item.subtitle)}</p><dl className="mt-3 space-y-2 text-sm">{[[data.issuerLabel, item.issuer], [data.numberLabel, item.number], [data.validLabel, item.validUntil], [data.scopeLabel, item.scope]].map(([label, value], i) => <div key={i}><dt className="font-semibold">{t(label)}</dt><dd>{t(value)}</dd></div>)}</dl></details>)}
      {data.legalItems?.map((item) => <details key={item.id} className="border-b border-line py-3"><summary className="min-h-11 cursor-pointer font-semibold">{t(item.question)}</summary><p className="text-sm leading-7">{t(item.answer)}</p><a href={item.source} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm text-primary underline">{en ? "View source" : "Tra cứu nguồn của mục này"}</a>{!item.verified && <p className="text-xs text-fg-muted">{en ? "Unverified legal content" : "Dữ liệu pháp lý chưa xác minh"}</p>}</details>)}
    </div></div>
  </div></section>;
}
