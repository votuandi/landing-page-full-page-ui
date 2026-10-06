import { FAQS } from "@/data/faq";

export default function FaqSection() {
  return (
    <section className="t5-section bg-bg" aria-labelledby="faq-title">
      <div className="t5-container grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
        <div data-reveal="left">
          <span className="t5-eyebrow">Hỏi đáp</span>
          <h2 id="faq-title" className="t5-heading">Những điều khách hay hỏi trước khi lắp.</h2>
        </div>
        <div data-reveal-stagger="right" data-reveal-step="0.08" className="grid gap-3">
          {FAQS.map(([q, a]) => (
            <details key={q} className="t8-card group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-black text-fg">
                {q}
                <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bg-tint text-primary-strong transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-fg-muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
