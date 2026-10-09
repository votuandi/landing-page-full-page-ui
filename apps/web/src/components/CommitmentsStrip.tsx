import { ClipboardDocumentCheckIcon, MagnifyingGlassIcon, ShieldCheckIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { siteConfig } from "@/config/site.config";
import { Tr } from "@/i18n/LangProvider";

const ICONS = [MagnifyingGlassIcon, ShieldCheckIcon, ClipboardDocumentCheckIcon, WrenchScrewdriverIcon];
const TONES = ["bg-primary/10 text-primary", "bg-secondary/10 text-secondary", "bg-accent/25 text-accent-ink", "bg-primary/10 text-primary"];

/** Dải cam kết dịch vụ ngay trước footer (mọi trang) — nội dung lấy từ siteConfig.commitments. */
export default function CommitmentsStrip() {
  const items = siteConfig.commitments;
  if (!items.length) return null;
  return (
    <section aria-label="Cam kết dịch vụ" className="border-t border-line/10 bg-bg-elevated">
      <ul className="t15-container grid grid-cols-2 gap-x-4 gap-y-6 py-8 lg:grid-cols-4">
        {items.map((c, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <li key={i} className="flex items-start gap-3">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${TONES[i % TONES.length]}`}><Icon className="h-6 w-6" /></span>
              <span><span className="block text-sm font-black text-fg sm:text-base"><Tr text={c.title} /></span><span className="mt-0.5 block text-xs leading-5 text-fg-muted"><Tr text={c.desc} /></span></span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
