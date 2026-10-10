import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, link } from "../fields";
import { faqFixture } from "./fixtures";

export const faqSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }),
  moreLink: link().optional(), items: z.array(z.object({ question: localized({ max: 200 }).refine((q) => q.vi.trim().length > 0), answer: localized({ multiline: true, max: 1500 }).refine((a) => a.vi.trim().length > 0) })).min(1).max(30), jsonLd: z.boolean().default(true),
});

export const faq = defineSectionType({
  type: "faq", schemaVersion: 1, schema: faqSchema,
  defaults: faqSchema.parse(faqFixture),
  meta: {"label": {"vi": "Câu hỏi thường gặp", "en": "FAQ"}, "icon": "faq", "entitlement": "faq", "maxPerPage": 1},
});
