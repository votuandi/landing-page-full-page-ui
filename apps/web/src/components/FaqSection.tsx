import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { FAQS } from "@/data/faq";
import { Tr } from "@/i18n/LangProvider";

/** Câu hỏi thường gặp (dữ liệu ở src/data/faq.ts, kèm FAQPage schema ở trang chủ). */
export default function FaqSection() {
  return (
    <section id="hoi-dap" className="t15-section bg-bg" aria-labelledby="faq-title">
      <div className="t15-container grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
        <div data-reveal="left" className="lg:sticky lg:top-28 lg:self-start">
          <span className="t15-eyebrow"><Tr vi="Câu hỏi thường gặp" en="FAQ" /></span>
          <h2 id="faq-title" className="t15-heading"><Tr vi="Những điều nên rõ trước khi lắp đặt." en="What to know before you install." /></h2>
          <Link href="/cam-nang" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-primary hover:gap-3"><Tr vi="Xem cẩm nang đầy đủ" en="Read the full guide" /><ArrowRightIcon className="h-4 w-4" /></Link>
        </div>
        <div data-reveal-stagger="right" data-reveal-step="0.06" className="grid gap-3">
          {FAQS.map(([q, a]) => (
            <details key={q} className="t15-card group px-6 py-5 open:border-primary/30">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-black text-fg">
                {q}
                <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-lg text-primary transition group-open:rotate-45 group-open:bg-accent group-open:text-on-accent">+</span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-fg-muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
