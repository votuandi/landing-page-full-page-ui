import type { SectionPropsOf } from "../../define";
import { pickLocale, resolveLink } from "../../fields";
import type { consultPopup } from "./schema";
import ConsultPopup from "./t15.client";

export default function ConsultPopupT15({ data, site, sectionId }: SectionPropsOf<typeof consultPopup>) {
  const t = (text: { vi: string; en?: string }) => pickLocale(text, site.locale);
  return <ConsultPopup sectionId={sectionId} locale={site.locale} delayMs={data.delayMs} scrollRatio={data.scrollRatio} autoOpen={data.autoOpen}
    title={t(data.title)} description={t(data.description)} openFormLabel={t(data.openFormLabel)}
    text={{ submit: t(data.submitLabel), success: t(data.success), privacy: t(data.privacy) }}
    channels={data.channels.map((channel) => ({ kind: channel.kind, ...resolveLink(channel.link), label: t(channel.link.label) }))} />;
}
