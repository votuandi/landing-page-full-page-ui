import { SectionHead } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import type { trust } from "./schema";
import Trust from "./t15.client";

export default function TrustT15({ data, site, sectionId }: SectionPropsOf<typeof trust>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section relative overflow-hidden bg-bg-elevated" aria-labelledby={`${sectionId}-title`}>
    <div aria-hidden className="pointer-events-none absolute -left-40 top-10 h-[480px] w-[480px] rounded-full bg-glow-primary-14" />
    <div className="t15-container relative"><SectionHead id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={data.description && t(data.description)} />
      <Trust locale={site.locale} labels={[t(data.issuerLabel), t(data.numberLabel), t(data.validLabel), t(data.scopeLabel)]} items={data.items.map((cert) => ({ id: cert.id, title: t(cert.title), subtitle: t(cert.subtitle), issuer: t(cert.issuer), number: t(cert.number), validUntil: t(cert.validUntil), scope: t(cert.scope), image: mediaSrc(cert.image), imageAlt: cert.image ? t(cert.image.alt) : t(cert.title) }))} />
    </div>
  </section>;
}
