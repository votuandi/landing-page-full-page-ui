import { CalculatorIcon } from "@heroicons/react/24/outline";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import type { calculator } from "./schema";
import Calculator from "./t15.client";

/** Dự toán t15: tiêu đề render server, phần nhập/kết quả/form là island (SSR sẵn giá trị mặc định). */
export default function CalculatorT15({ data, site, sectionId }: SectionPropsOf<typeof calculator>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const titleId = `${sectionId}-title`;
  return (
    <section aria-labelledby={titleId} className="t15-section relative overflow-hidden bg-gradient-to-b from-bg-sun/70 to-bg">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-glow-accent-22" />
      <div className="t15-container relative">
        <div data-reveal="down" className="max-w-3xl">
          <span className="t15-eyebrow"><CalculatorIcon aria-hidden className="h-4 w-4" />{t(data.eyebrow)}</span>
          <h2 id={titleId} className="t15-heading">{t(data.title.lead)} <span className="t15-gradient-text">{t(data.title.highlight)}</span>.</h2>
          <p className="t15-subheading">{t(data.description)}</p>
        </div>
        <Calculator data={data} locale={site.locale} sectionId={sectionId} />
      </div>
    </section>
  );
}
