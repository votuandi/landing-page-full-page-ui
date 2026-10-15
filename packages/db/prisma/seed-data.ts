import { applyPlanToPreset, loadPreset, presetStructure } from "@solar/presets";
import { plans } from "@solar/plans";
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

// t12 is Pro plus the catalog addon so both demos keep the product routes (D8, D21).
const demoPlans = { t15: { planId: "premium", addons: [] }, t12: { planId: "pro", addons: ["catalog"] } } as const;

export function buildDemo(id: "t15" | "t12") {
  const { preset, page, widgets } = loadPreset(id);
  const { planId, addons } = demoPlans[id];
  const can = (feature: string) => (plans[planId].features as ReadonlySet<string>).has(feature) || (addons as readonly string[]).includes(feature);
  // Same plan policy as the site wizard (D21): every page, including system-page defaults, is filtered by plan.
  const structure = presetStructure({ id: preset.id, pages: preset.pages, sections: page.sections }, can);
  const homeSections = applyPlanToPreset({ pages: preset.pages, sections: page.sections }, can).sections;
  const name = `[DỮ LIỆU MẪU] Demo ${id}`;
  const localized = (value: string) => ({ vi: value });
  const sections = homeSections.map((section) => {
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
  const titles: Record<string, string> = { "ve-chung-toi": `Về ${name}`, "lien-he": `Liên hệ ${name}`, "cam-nang": `Cẩm nang ${name}` };
  const pages = [
    makePage("", "home", name, sections),
    ...structure.pages.filter((item) => item.slug !== "").map((item) => makePage(item.slug, "system", titles[item.slug] ?? name,
      item.sections.map((section) => ({ ...section, anchor: section.type, data: sectionRegistry.getType(section.type)!.defaults as Record<string, unknown> })))),
    makePage("uu-dai/nang-luong", "landing", `Ưu đãi ${name}`, sections.filter((section) => section.type === "hero")),
  ];
  return {
    id, name, themeId: preset.themeId, widgets, pages, planId, addons: [...addons], pageTypes: structure.pageTypes,
    profile: {
      name: localized(name), description: localized(`${name} — Đồng hành cùng từng mái nhà.`),
      email: siteConfig.brand.email, hotline: siteConfig.branches[0].hotline.main, theme: siteConfig.theme,
      guide: { ...siteConfig.guide, tariffs: Object.entries(TARIFFS).flatMap(([segment, tariff]) => tariff.kind === "tiered"
        ? tariff.tiers.map((tier, index) => [`[DỮ LIỆU MẪU] Sinh hoạt — bậc ${index + 1}`, `${tier.upTo ? `Đến ${tier.upTo} kWh` : "Bậc cuối"}: ${tier.price} đ/kWh (chưa VAT)`])
        : [[`[DỮ LIỆU MẪU] ${segment}`, `${tariff.averageRate} đ/kWh bình quân (chưa VAT)`]]) },
      legal: { policies: siteConfig.legal.policies.map((policy) => ({ ...policy, body: { vi: [{ type: "paragraph", children: [{ type: "text", text: `[DỮ LIỆU MẪU] ${name}: ${policy.summary}` }] }] } })) },
      team: TEAM, timeline: [["2015", "[DỮ LIỆU MẪU] Thành lập", name], ["2026", "[DỮ LIỆU MẪU] Phát triển", "Đồng hành cùng khách hàng"]],
    },
    seo: { title: localized(name), description: localized(`${name} — Thiết kế và lắp đặt điện mặt trời.`), ogImage: id === "t15" ? "/images/solar-panels-hero.jpg" : "/images/solar-battery-hero.jpg",
      // Slug cũ của template-8 (trước đây ở apps/web/next.config.ts), tenant tự sửa được.
      redirects: [["/about-us", "/ve-chung-toi"], ["/contact-us", "/lien-he"], ["/service", "/giai-phap"], ["/service/:slug", "/giai-phap/:slug"],
        ["/project/:slug", "/cong-trinh/:slug"], ["/product", "/san-pham"], ["/product/:slug", "/san-pham/:slug"], ["/news", "/tin-tuc"], ["/news/:slug", "/tin-tuc/:slug"]]
        .map(([from, to]) => ({ from, to })) },
    pageSections: homeSections.map(({ data: _data, ...descriptor }) => descriptor),
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
      services: SERVICES.map((item, order) => row(item.slug, `${name} ${item.title}`, { ...item, segment: item.slug === "solar-gia-dinh" ? "household" : item.slug === "hybrid-luu-tru" ? "shop" : "factory" }, order)),
      branches: siteConfig.branches.map((item, order) => ({ ...row(item.id, item.name, item, order), isPrimary: item.primary ?? false })),
      certificates: siteConfig.certificates.items.map((item, order) => row(item.id, typeof item.title === "string" ? item.title : item.title.vi, item, order)),
      pressItems: siteConfig.press.articles.map((item, order) => row(`article-${order + 1}`, item.title, item, order)),
      stories: STORIES.map((item, order) => ({ ...row(item.id, item.shortTitle, item, order), segment: item.segment, kind: item.type })),
      testimonials: TESTIMONIALS.map((item, order) => ({ ...row(slugify(item.name), item.name, item, order), segment: item.segment, rating: item.rating })),
      faqs: FAQS.map(([question, answer], order) => row(slugify(question), question, { question: { vi: question }, answer: { vi: answer } }, order)),
    },
  };
}
