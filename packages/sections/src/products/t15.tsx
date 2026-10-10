import { SectionHead } from "@solar/ui";
import { pickLocale } from "../fields";
import type { SectionPropsOf } from "../define";
import type { products } from "./schema";
import { mediaSrc } from "../shared/media";
import { SectionLink } from "../render/SectionLink";
import Products from "./t15.client";

export default function ProductsT15({ data, site, sectionId }: SectionPropsOf<typeof products>) {
  if (!data.items.length) return null;
  const t = (text: { vi: string; en?: string }) => pickLocale(text, site.locale);
  return <section className="t15-section relative overflow-hidden bg-bg-elevated" aria-labelledby={sectionId + "-title"}>
    <div className="t15-container">
      <SectionHead id={sectionId + "-title"} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={data.description && t(data.description)}
        action={data.allLink && <SectionLink link={data.allLink} locale={site.locale} className="t15-button t15-button-secondary" />} />
      <Products sectionId={sectionId} locale={site.locale}
        items={data.items.map((item) => ({ ...item, images: item.images.map((image) => ({ src: mediaSrc(image), alt: t(image.alt) })) }))}
        labels={{ quick: t(data.quickViewLabel), add: t(data.addLabel), compactAdd: t(data.compactAddLabel), added: t(data.addedLabel),
          cart: t(data.viewCartLabel), details: t(data.detailsLabel), warranty: t(data.warrantyLabel), contact: t(data.contactPriceLabel) }} />
    </div>
  </section>;
}
