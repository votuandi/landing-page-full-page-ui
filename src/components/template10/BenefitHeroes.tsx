"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { BENEFIT_HEROES, COPY, SEGMENTS } from "@/content/site";
import { contactUrl, useSegment } from "./SegmentContext";

export default function BenefitHeroes() {
  const ref = useRef<HTMLDivElement>(null);
  const { select } = useSegment();
  useEffect(() => {
    const elements = ref.current?.querySelectorAll("[data-benefit-reveal]");
    if (!elements || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref}>
      {BENEFIT_HEROES.map((hero, i) => {
        const s = SEGMENTS[hero.segment];
        return (
          <section
            key={hero.segment}
            id={`loi-ich-${hero.segment}`}
            className={`benefit-hero benefit-${hero.segment}`}
            aria-labelledby={`benefit-title-${hero.segment}`}
          >
            <div className="t5-container benefit-layout">
              <div
                className={`benefit-visual ${i === 1 ? "lg:order-2" : ""}`}
                data-benefit-reveal="image"
              >
                <div className="benefit-photo">
                  <Image
                    src={hero.image.src}
                    alt={hero.image.alt}
                    fill
                    sizes="(min-width:1024px) 48vw, 95vw"
                    className="object-cover"
                  />
                  <span className="benefit-image-note">{COPY.imageNote}</span>
                </div>
                <div className="benefit-tag">
                  <span className="benefit-spark" aria-hidden="true">
                    ✦
                  </span>
                  {hero.tag}
                </div>
              </div>
              <div data-benefit-reveal="copy">
                <p className="t5-eyebrow">{hero.eyebrow}</p>
                <h2
                  id={`benefit-title-${hero.segment}`}
                  className="benefit-title"
                >
                  {hero.title}
                </h2>
                <p className="benefit-intro">{hero.intro}</p>
                <div className="benefit-grid">
                  {s.benefits.map((benefit) => (
                    <article key={benefit.title} className="benefit-tile">
                      <p className="benefit-value">{benefit.value}</p>
                      <h3 className="mt-2 text-sm font-black">
                        {benefit.title}
                      </h3>
                      <p className="mt-2 text-xs leading-6">{benefit.text}</p>
                    </article>
                  ))}
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href={
                      hero.segment === "home"
                        ? "#may-tinh"
                        : contactUrl(hero.segment)
                    }
                    className="t5-button t5-button-primary text-center"
                    onClick={() => select(hero.segment)}
                  >
                    {s.cta}
                    <span aria-hidden="true">↗</span>
                  </Link>
                  <Link
                    href={`/giai-phap/${s.slug}`}
                    className="benefit-detail"
                  >
                    {hero.detailCta}
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <p className="mt-4 text-xs leading-6 benefit-condition">
                  {COPY.conditions}
                </p>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
