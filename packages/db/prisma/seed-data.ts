import { loadPreset } from "@solar/presets";
import { sectionRegistry } from "@solar/sections";
import { CATEGORIES, PRODUCTS } from "../../../apps/web/src/data/products.ts";
import { PROJECTS } from "../../../apps/web/src/data/projects.ts";
import { POSTS } from "../../../apps/web/src/data/posts.ts";
import { STORIES } from "../../../apps/web/src/data/stories.ts";
import { TESTIMONIALS } from "../../../apps/web/src/data/testimonials.ts";
import { FAQS } from "../../../apps/web/src/data/faq.ts";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
const row = <T>(slug: string, title: string, data: T, order: number) => ({
  slug, title: { vi: title }, data, order, status: "published" as const,
});

export function buildDemo(id: "t15" | "t12") {
  const { preset, page, widgets } = loadPreset(id);
  return {
    id, name: `[DỮ LIỆU MẪU] Demo ${id}`, themeId: preset.themeId, widgets,
    pageSections: page.sections.map(({ data: _data, ...descriptor }) => descriptor),
    sections: page.sections.map((section) => ({
      sectionId: section.id, type: section.type,
      schemaVersion: sectionRegistry.getType(section.type)!.schemaVersion, data: section.data,
    })),
    collections: {
      categories: CATEGORIES.map((item, order) => row(item.value, item.label, item, order)),
      brands: [...new Set(PRODUCTS.map((item) => item.brand))].map((name, order) => row(slugify(name), name, { name }, order)),
      products: PRODUCTS.map((item, order) => ({ ...row(item.slug, item.name, item, order),
        price: item.price, salePrice: item.salePrice, featured: item.featured ?? false, segments: item.segment,
        categorySlug: item.category, brandSlug: slugify(item.brand),
      })),
      projects: PROJECTS.map((item, order) => ({ ...row(item.slug, item.title, item, order), segment: item.segment, kwp: item.kwp })),
      posts: POSTS.map((item, order) => ({ ...row(item.slug, item.title, item, order), segment: item.segment })),
      stories: STORIES.map((item, order) => ({ ...row(item.id, item.shortTitle, item, order), segment: item.segment, kind: item.type })),
      testimonials: TESTIMONIALS.map((item, order) => ({ ...row(slugify(item.name), item.name, item, order), segment: item.segment, rating: item.rating })),
      faqs: FAQS.map(([question, answer], order) => row(slugify(question), question, { question: { vi: question }, answer: { vi: answer } }, order)),
    },
  };
}
