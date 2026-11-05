type PageTemplate = { label: { vi: string }; title: { vi: string }; slug: string; sections: readonly string[] };
export const PAGE_TEMPLATES = {
  "ho-gia-dinh": { label: { vi: "Landing hộ gia đình" }, title: { vi: "Điện mặt trời hộ gia đình" }, slug: "dien-mat-troi-ho-gia-dinh", sections: ["hero", "process", "calculator", "testimonials", "faq", "lead-form"] },
  "nha-xuong": { label: { vi: "Landing nhà xưởng" }, title: { vi: "Điện mặt trời nhà xưởng" }, slug: "dien-mat-troi-nha-xuong", sections: ["hero", "stats", "process", "trust", "faq", "lead-form"] },
  "tuyen-dai-ly": { label: { vi: "Tuyển đại lý" }, title: { vi: "Tuyển đại lý" }, slug: "tuyen-dai-ly", sections: ["hero", "dealer", "process", "faq", "cta-banner"] },
} as const satisfies Record<string, PageTemplate>;
export type PageTemplateId = keyof typeof PAGE_TEMPLATES;
