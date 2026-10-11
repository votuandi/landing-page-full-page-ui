import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import type { trust } from "./schema";
import Trust from "./t13.client";

/** Phần chứng chỉ trong TrustSection của t13; báo chí, đánh giá và brands dùng type riêng. */
export default function TrustT13({ data, site, sectionId }: SectionPropsOf<typeof trust>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section relative overflow-hidden bg-bg-tint" aria-labelledby={`${sectionId}-title`}>
    <div aria-hidden className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-pill bg-glow-leaf-22" />
    <div className="t15-container relative">
      <div data-reveal="down">
        <span className="t15-eyebrow">{t(data.eyebrow)}</span>
        <h2 id={`${sectionId}-title`} className="t15-heading">{t(data.title)}</h2>
        {data.description && <p className="t15-subheading">{t(data.description)}</p>}
      </div>
      <Trust locale={site.locale} labels={[t(data.issuerLabel), t(data.numberLabel), t(data.validLabel), t(data.scopeLabel)]}
        items={data.items.map((cert) => ({ id: cert.id, title: t(cert.title), subtitle: t(cert.subtitle), issuer: t(cert.issuer), number: t(cert.number), validUntil: t(cert.validUntil), scope: t(cert.scope), image: mediaSrc(cert.image), imageAlt: cert.image ? t(cert.image.alt) : t(cert.title), logo: mediaSrc(cert.logo), logoAlt: cert.logo ? t(cert.logo.alt) : t(cert.title) }))} />
    </div>
  </section>;
}
