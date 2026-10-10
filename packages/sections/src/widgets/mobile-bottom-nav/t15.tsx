import type { SectionPropsOf } from "../../define";
import { pickLocale, resolveLink } from "../../fields";
import type { mobileBottomNav } from "./schema";
import MobileBottomNav from "./t15.client";

export default function MobileBottomNavT15({ data, site }: SectionPropsOf<typeof mobileBottomNav>) {
  return <MobileBottomNav ariaLabel={pickLocale(data.ariaLabel, site.locale)}
    items={data.items.map((item) => ({ icon: item.icon, emphasis: item.emphasis, label: pickLocale(item.label, site.locale), link: item.link && resolveLink(item.link) }))} />;
}
