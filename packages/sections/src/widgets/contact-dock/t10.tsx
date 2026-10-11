import type { SectionPropsOf } from "../../define";
import { pickLocale, resolveLink } from "../../fields";
import { T10_UI } from "../../shared/t10";
import type { contactDock } from "./schema";
import ContactDock from "./t10.client";

/** Contact dock t10 (FloatingContact): nút "liên hệ nhanh" mở chồng kênh bo tròn; thanh 3 nút cố định đáy màn hình mobile. */
export default function ContactDockT10({ data, site }: SectionPropsOf<typeof contactDock>) {
  return <ContactDock ariaLabel={pickLocale(data.ariaLabel, site.locale)} mobileBar={data.mobileBar} ui={T10_UI[site.locale]}
    items={data.items.map((item) => ({ kind: item.kind, label: pickLocale(item.label, site.locale), link: item.link && resolveLink(item.link) }))} />;
}
