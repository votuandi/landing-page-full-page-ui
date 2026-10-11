import type { SectionPropsOf } from "../../define";
import { pickLocale } from "../../fields";
import { SectionLink } from "../../render/SectionLink";
import type { contactDock } from "./schema";
import ConsultButton from "./t11.client";
import { ChatBubbleLeftRightIcon, PhoneIcon } from "@heroicons/react/24/outline";

export default function ContactDockT11({ data, site }: SectionPropsOf<typeof contactDock>) {
  return <nav aria-label={pickLocale(data.ariaLabel, site.locale)} className={`fixed z-40 items-stretch gap-2 border border-line bg-bg-elevated p-2 text-primary shadow-lg ${data.mobileBar ? "inset-x-0 bottom-0 flex lg:hidden" : "bottom-7 right-7 hidden flex-col rounded-card lg:flex"}`} style={data.mobileBar ? { paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" } : undefined}>
    {data.items.map((item, i) => {
      const label = pickLocale(item.label, site.locale), Icon = item.kind === "call" ? PhoneIcon : ChatBubbleLeftRightIcon;
      const className = `flex min-h-12 flex-1 items-center justify-center gap-2 rounded-button px-3 py-3 text-xs font-semibold transition-colors ${i === data.items.length - 1 ? "bg-accent text-on-accent" : "bg-bg-sky text-primary"}`;
      const content = <><Icon aria-hidden className="h-5 w-5 shrink-0" /><span>{label}</span></>;
      return item.kind === "consult" ? <ConsultButton key={i} label={label} className={className}>{content}</ConsultButton> : item.link && <SectionLink key={i} link={item.link} locale={site.locale} className={className}>{content}</SectionLink>;
    })}
  </nav>;
}
