import type { SectionPropsOf } from "../../define";
import { pickLocale, resolveLink } from "../../fields";
import { mediaSrc } from "../../shared/media";
import type { quoteCart } from "./schema";
import QuoteCart from "./t15.client";

export default function QuoteCartT15({ data, site, sectionId }: SectionPropsOf<typeof quoteCart>) {
  const t = (text: { vi: string; en?: string }) => pickLocale(text, site.locale);
  return <QuoteCart sectionId={sectionId} locale={site.locale} browseLink={resolveLink(data.browseLink)}
    items={data.items.map((item) => ({ slug: item.slug, name: item.name, price: item.price, salePrice: item.salePrice,
      image: { src: mediaSrc(item.images[0]), alt: t(item.images[0].alt) } }))}
    labels={{ title: t(data.title), note: t(data.note), emptyText: t(data.emptyText), browseLabel: t(data.browseLabel),
      formTitle: t(data.formTitle), formDescription: t(data.formDescription), messagePlaceholder: t(data.messagePlaceholder),
      submitLabel: t(data.submitLabel), successTitle: t(data.successTitle), successMessage: t(data.successMessage),
      continueLabel: t(data.continueLabel), buttonLabel: t(data.buttonLabel) }} />;
}
