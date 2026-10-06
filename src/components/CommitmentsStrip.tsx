import { ClipboardDocumentCheckIcon, MagnifyingGlassIcon, ShieldCheckIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { SITE_CONFIG } from "@/config/site";

const ICONS = [MagnifyingGlassIcon, ShieldCheckIcon, ClipboardDocumentCheckIcon, WrenchScrewdriverIcon];

/** Dải cam kết dịch vụ ngay trước footer — nội dung lấy từ config.commitments. */
export default function CommitmentsStrip() {
  const items = SITE_CONFIG.commitments;
  if (!items.length) return null;
  return (
    <section aria-label="Cam kết dịch vụ" className="border-y border-line/12 bg-bg-elevated">
      <ul className="t5-container grid grid-cols-2 gap-x-4 gap-y-6 py-8 lg:grid-cols-4">
        {items.map((c, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <li key={c.title} className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></span>
              <span><span className="block text-sm font-black text-fg sm:text-base">{c.title}</span><span className="mt-0.5 block text-xs leading-5 text-fg-muted">{c.desc}</span></span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
