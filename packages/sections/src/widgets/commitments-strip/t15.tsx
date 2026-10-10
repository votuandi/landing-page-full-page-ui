import { ClipboardDocumentCheckIcon, MagnifyingGlassIcon, ShieldCheckIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import type { SectionPropsOf } from "../../define";
import { pickLocale } from "../../fields";
import type { commitmentsStrip } from "./schema";

const ICONS = { survey: MagnifyingGlassIcon, warranty: ShieldCheckIcon, paperwork: ClipboardDocumentCheckIcon, maintenance: WrenchScrewdriverIcon };
const TONES = ["bg-primary/10 text-primary", "bg-secondary/10 text-secondary", "bg-accent/25 text-accent-ink", "bg-primary/10 text-primary"];
export default function CommitmentsStripT15({ data, site }: SectionPropsOf<typeof commitmentsStrip>) {
  return <section aria-label={pickLocale(data.ariaLabel, site.locale)} className="border-t border-line/10 bg-bg-elevated">
    <ul className="t15-container grid grid-cols-2 gap-x-4 gap-y-6 py-8 lg:grid-cols-4">
      {data.items.map((item, i) => {
        const Icon = ICONS[item.icon];
        return <li key={i} className="flex items-start gap-3">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-card ${TONES[i]}`}><Icon aria-hidden className="h-6 w-6" /></span>
          <span><span className="block text-sm font-black text-fg sm:text-base">{pickLocale(item.title, site.locale)}</span>
            <span className="mt-0.5 block text-xs leading-5 text-fg-muted">{pickLocale(item.description, site.locale)}</span></span>
        </li>;
      })}
    </ul>
  </section>;
}
