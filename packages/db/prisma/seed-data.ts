import { loadPreset } from "@solar/presets";
import { sectionRegistry } from "@solar/sections";
import { CATEGORIES, PRODUCTS } from "../../../apps/web/src/data/products.ts";
import { PROJECTS } from "../../../apps/web/src/data/projects.ts";
import { POSTS } from "../../../apps/web/src/data/posts.ts";
import { STORIES } from "../../../apps/web/src/data/stories.ts";
import { TESTIMONIALS } from "../../../apps/web/src/data/testimonials.ts";
import { FAQS } from "../../../apps/web/src/data/faq.ts";
import { siteConfig } from "../../../apps/web/src/config/site.config.ts";
import { SERVICES, TEAM } from "../../../apps/web/src/data/solar.ts";
import { TARIFFS } from "../../../apps/web/src/config/solar.ts";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
const row = <T>(slug: string, title: string, data: T, order: number) => ({
  slug, title: { vi: title }, data, order, status: "published" as const,
});

export function buildDemo(id: "t15" | "t12") {
  const { preset, page, widgets } = loadPreset(id);
  const name = `[DỮ LIỆU MẪU] Demo ${id}`;
  const localized = (value: string) => ({ vi: value });
  const sections = page.sections.map((section) => {
    const data = structuredClone(section.data) as Record<string, unknown>;
    if (section.type === "site-header") data.brand = { ...(data.brand as object), name };
    if (section.type === "site-footer") {
      data.brand = { ...(data.brand as object), name };
      data.legal = { ...(data.legal as object), legalName: name };
    }
    if (section.type === "hero") {
      data.title = { ...(data.title as object), lead: localized(name) };
      data.description = localized(`${name} — Thiết kế và lắp đặt điện mặt trời từ dữ liệu DB.`);
    }
    return { ...section, data };
  });
  const makePage = (slug: string, kind: "home" | "system" | "landing", title: string, contents: typeof sections) => ({
    slug, kind, title: localized(title),
    pageSections: contents.map(({ data: _data, ...descriptor }) => descriptor),
    sections: contents.map((section) => ({ sectionId: section.id, type: section.type,
      schemaVersion: sectionRegistry.getType(section.type)!.schemaVersion, data: section.data })),
  });
  const system = (types: string[]) => types.map((type, index) => ({ id: `${id}-${type}-${index}`, type, variant: "t15", enabled: true, anchor: type, data: sectionRegistry.getType(type)!.defaults as Record<string, unknown> }));
  const pages = [
    makePage("", "home", name, sections),
    makePage("ve-chung-toi", "system", `Về ${name}`, system(["about-story", "stats", "trust", "warranty"])),
    makePage("lien-he", "system", `Liên hệ ${name}`, system(["lead-form", "branch-map"])),
    makePage("cam-nang", "system", `Cẩm nang ${name}`, system([])),
    makePage("uu-dai/nang-luong", "landing", `Ưu đãi ${name}`, sections.filter((section) => section.type === "hero")),
  ];
  return {
    id, name, themeId: preset.themeId, widgets, pages,
    profile: {
      name: localized(name), description: localized(`${name} — Đồng hành cùng từng mái nhà.`),
      email: siteConfig.brand.email, hotline: siteConfig.branches[0].hotline.main, theme: siteConfig.theme,
      guide: { ...siteConfig.guide, tariffs: Object.entries(TARIFFS).flatMap(([segment, tariff]) => tariff.kind === "tiered"
        ? tariff.tiers.map((tier, index) => [`[DỮ LIỆU MẪU] Sinh hoạt — bậc ${index + 1}`, `${tier.upTo ? `Đến ${tier.upTo} kWh` : "Bậc cuối"}: ${tier.price} đ/kWh (chưa VAT)`])
        : [[`[DỮ LIỆU MẪU] ${segment}`, `${tariff.averageRate} đ/kWh bình quân (chưa VAT)`]]) },
      legal: { policies: siteConfig.legal.policies.map((policy) => ({ ...policy, body: { vi: [{ type: "paragraph", children: [{ type: "text", text: `[DỮ LIỆU MẪU] ${name}: ${policy.summary}` }] }] } })) },
      team: TEAM, timeline: [["2015", "[DỮ LIỆU MẪU] Thành lập", name], ["2026", "[DỮ LIỆU MẪU] Phát triển", "Đồng hành cùng khách hàng"]],
    },
    seo: { title: localized(name), description: localized(`${name} — Thiết kế và lắp đặt điện mặt trời.`), ogImage: id === "t15" ? "/images/solar-panels-hero.jpg" : "/images/solar-battery-hero.jpg" },
    pageSections: page.sections.map(({ data: _data, ...descriptor }) => descriptor),
    sections: sections.map((section) => ({
      sectionId: section.id, type: section.type,
      schemaVersion: sectionRegistry.getType(section.type)!.schemaVersion, data: section.data,
    })),
    collections: {
      categories: CATEGORIES.map((item, order) => row(item.value, item.label, item, order)),
      brands: [...new Set(PRODUCTS.map((item) => item.brand))].map((name, order) => row(slugify(name), name, { name }, order)),
      products: PRODUCTS.map((item, order) => ({ ...row(item.slug, `${name} ${item.name}`, { ...item, name: `${name} ${item.name}` }, order),
        price: item.price, salePrice: item.salePrice, featured: item.featured ?? false, segments: item.segment,
        categorySlug: item.category, brandSlug: slugify(item.brand),
      })),
      projects: PROJECTS.map((item, order) => ({ ...row(item.slug, `${name} ${item.title}`, { ...item, title: `${name} ${item.title}`, detail: `${name} — ${item.detail}` }, order), segment: item.segment, kwp: item.kwp })),
      posts: POSTS.map((item, order) => ({ ...row(item.slug, `${name} ${item.title}`, { ...item, title: `${name} ${item.title}`, excerpt: `${name} — ${item.excerpt}` }, order), segment: item.segment })),
      services: SERVICES.map((item, order) => row(item.slug, `${name} ${item.title}`, item, order)),
      branches: siteConfig.branches.map((item, order) => row(item.id, item.name, item, order)),
      certificates: siteConfig.certificates.items.map((item, order) => row(item.id, typeof item.title === "string" ? item.title : item.title.vi, item, order)),
      pressItems: siteConfig.press.articles.map((item, order) => row(`article-${order + 1}`, item.title, item, order)),
      stories: STORIES.map((item, order) => ({ ...row(item.id, item.shortTitle, item, order), segment: item.segment, kind: item.type })),
      testimonials: TESTIMONIALS.map((item, order) => ({ ...row(slugify(item.name), item.name, item, order), segment: item.segment, rating: item.rating })),
      faqs: FAQS.map(([question, answer], order) => row(slugify(question), question, { question: { vi: question }, answer: { vi: answer } }, order)),
    },
  };
}
