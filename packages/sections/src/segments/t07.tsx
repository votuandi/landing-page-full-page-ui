import { calculateSolar, SEGMENT_SLUGS, type Segment } from "@solar/core";
import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { calculator } from "../calculator/schema";
import { toCalculatorParams } from "../calculator/params";
import { SegmentIcon } from "../shared/SegmentIcon";
import { SolarSceneIllustration } from "../shared/illustrations/t07/SolarIllustrations";
import { mediaSrc } from "../shared/media";
import type { segments } from "./schema";

// [DỮ LIỆU MẪU] Giữ hóa đơn/tỷ lệ của template-7; biểu giá và mô hình tính dùng core hiện hành.
const SCENARIOS: Record<Segment, { monthlyBill: number; daytimeRatio: number }> = {
  factory: { monthlyBill: 120_000_000, daytimeRatio: 45 },
  shop: { monthlyBill: 12_000_000, daytimeRatio: 40 },
  household: { monthlyBill: 3_000_000, daytimeRatio: 35 },
  farm: { monthlyBill: 25_000_000, daytimeRatio: 70 },
};

export default function SegmentsT07({ data, site, sectionId }: SectionPropsOf<typeof segments>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const number = (value: number) => new Intl.NumberFormat(site.locale === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: 2 }).format(value);
  const params = toCalculatorParams(calculator.defaults);
  return <div className="text-fg">
    <section aria-labelledby={`${sectionId}-title`} className="flex min-h-section flex-col justify-center bg-bg-elevated py-section">
      <div className="mx-auto w-full max-w-[var(--container)] px-6 sm:px-7">
        <div className="grid items-end gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div><p data-reveal="down" className="text-xs font-bold uppercase tracking-widest text-primary">{t(data.eyebrow)}</p><h2 data-reveal="left" id={`${sectionId}-title`} className="mt-4 whitespace-pre-line font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{t(data.title)}</h2></div>
          <p data-reveal="up" className="max-w-xl text-sm leading-7 text-fg-muted">{t(data.description)}</p>
        </div>
        <div data-reveal="zoom" className="mt-10"><SolarSceneIllustration id={sectionId} /></div>
        <nav aria-label={t(data.eyebrow)} className="mt-8 grid gap-4 md:grid-cols-3">{data.items.map((item, i) => <a key={item.segment} href={`#${sectionId}-${item.segment}`} data-reveal={i % 2 ? "down" : "up"} className="flex min-h-16 items-center gap-3 rounded-card border border-line bg-bg-tint p-5 font-bold text-fg hover:bg-bg-sky"><SegmentIcon segment={item.segment} className="h-6 w-6 shrink-0" /><span>{t(item.label)}</span><span aria-hidden className="ml-auto text-fg-muted">{String(i + 1).padStart(2, "0")} ↗</span></a>)}</nav>
      </div>
    </section>
    {data.items.map((item, i) => {
      const scenario = SCENARIOS[item.segment];
      const result = calculateSolar({ segment: item.segment, ...scenario, province: "TP Hồ Chí Minh", roofArea: 50_000 }, params);
      const id = `${sectionId}-${item.segment}`;
      return <section key={item.segment} id={id} aria-labelledby={`${id}-title`} className={`flex min-h-section items-center py-section ${i % 2 ? "bg-bg" : "bg-bg-sky"}`}>
        <div className="mx-auto grid w-full max-w-[var(--container)] items-center gap-10 px-6 sm:px-7 lg:grid-cols-2">
          <div data-reveal={i % 2 ? "right" : "left"} className={`relative min-h-[320px] overflow-hidden rounded-media bg-bg-tint sm:min-h-[540px] ${i % 2 ? "lg:order-2" : ""}`}><MediaImage src={mediaSrc(item.image)} alt={t(item.image.alt)} sizes="(max-width:1023px) 100vw, 50vw" /><span className="absolute left-5 top-5 rounded-pill bg-bg-elevated px-3 py-2 text-xs font-bold">{String(i + 1).padStart(2, "0")} / {t(data.eyebrow)}</span></div>
          <div data-reveal={i % 2 ? "left" : "right"}>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">{t(item.label)}</p>
            <h3 id={`${id}-title`} className="mt-4 whitespace-pre-line font-display text-4xl font-extrabold leading-tight tracking-tight">{t(item.pitch)}</h3>
            <p className="mt-5 text-sm text-fg-muted">{t(data.savingLabel)} <strong className="text-primary">{item.saving}</strong></p>
            <dl className="mt-8 grid grid-cols-[1fr_auto] gap-4 border-y border-line py-6">
              <div><dt className="text-xs text-fg-muted">{t({ vi: "Tiết kiệm minh họa mỗi tháng", en: "Illustrative monthly savings" })}</dt><dd className="mt-2 text-3xl font-extrabold text-primary">{number(result.monthlySavings / 1_000_000)} <span className="text-sm">{t({ vi: "triệu đồng", en: "million VND" })}</span></dd></div>
              <div><dt className="text-xs text-fg-muted">{t({ vi: "Dùng ban ngày", en: "Daytime use" })}</dt><dd className="mt-2 text-3xl font-extrabold">{scenario.daytimeRatio}%</dd></div>
            </dl>
            <p className="mt-5 text-xs leading-6 text-fg-muted">{t({ vi: "[DỮ LIỆU MẪU] Hóa đơn", en: "[SAMPLE DATA] Monthly bill" })} {number(scenario.monthlyBill / 1_000_000)} {t({ vi: "triệu đồng/tháng; mái giả định", en: "million VND; assumed roof" })} {number(50_000)} m², {t({ vi: "TP Hồ Chí Minh. Tính theo biểu giá, VAT và tổn hao mẫu của công cụ dự toán; chưa tính bảo trì. Kết quả thực tế tùy phụ tải, mái và cấu hình.", en: "Ho Chi Minh City. Uses the estimator's sample tariffs, VAT and performance losses; excludes maintenance. Actual results depend on load, roof and configuration." })}</p>
            <a href={`?phan-khuc=${SEGMENT_SLUGS[item.segment]}#${data.targetAnchor}`} className="mt-6 inline-flex min-h-11 items-center font-bold text-primary underline">{t({ vi: "Tư vấn giải pháp phù hợp", en: "Discuss your solution" })} ↗</a>
          </div>
        </div>
      </section>;
    })}
  </div>;
}
