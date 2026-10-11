import type { SectionPropsOf } from "../../define";
import { pickLocale, resolveLink } from "../../fields";
import type { contactDock } from "./schema";
import ContactDock from "./t15.client";

export default function ContactDockT12({ data, site }: SectionPropsOf<typeof contactDock>) {
  return <ContactDock ariaLabel={pickLocale(data.ariaLabel, site.locale)} mobileBar={data.mobileBar} appearance="glass"
    items={data.items.map((item) => ({ kind: item.kind, label: pickLocale(item.label, site.locale), link: item.link && resolveLink(item.link) }))} />;
}
