import { randomUUID } from "node:crypto";
import { buildDemo } from "../../prisma/seed-data.ts";

export function demoBackup(id: "t15" | "t12" = "t15") {
  const demo = buildDemo(id), tenantId = randomUUID(), siteId = randomUUID();
  const stamp = "2026-10-24T00:00:00.000Z";
  const row = <T extends object>(data: T) => ({ id: randomUUID(), createdAt: stamp, updatedAt: stamp, ...data });
  const collections = Object.fromEntries(Object.entries({ productCategory: demo.collections.categories, brand: demo.collections.brands,
    product: demo.collections.products, project: demo.collections.projects, post: demo.collections.posts, story: demo.collections.stories,
    testimonial: demo.collections.testimonials, branch: demo.collections.branches, faq: demo.collections.faqs,
    service: demo.collections.services, certificate: demo.collections.certificates, pressItem: demo.collections.pressItems,
  }).map(([name, items]) => [name, items.map(item => {
    const { categorySlug: _category, brandSlug: _brand, ...data } = item as typeof item & { categorySlug?: string; brandSlug?: string };
    return row({ publishedAt: stamp, ...data });
  })]));
  const pages = demo.pages.map(page => row({ siteId, slug: page.slug, kind: page.kind, title: page.title,
    sections: page.pageSections, draftSections: null, revision: 1, publishedAt: stamp }));
  const bundle = {
    format: "solar-tenant-backup", version: 1, exportedAt: stamp, source: { tenantId, slug: `demo-${id}` },
    site: row({ id: siteId, name: demo.name, themeId: demo.themeId, presetId: id, themeOverrides: {}, pageTypes: demo.pageTypes,
      locales: ["vi"], defaultLocale: "vi", profile: demo.profile, widgets: demo.widgets, seo: demo.seo }),
    pages, pageVersions: demo.pages.map((page, i) => ({ id: randomUUID(), pageId: pages[i].id, revision: 1,
      snapshot: { sections: page.pageSections, contents: page.sections }, publishedBySiteUserId: null, publishedByPlatformAdminId: null, createdAt: stamp })),
    sectionContents: demo.pages.flatMap((page, i) => page.sections.map(section => row({ siteId, pageId: pages[i].id,
      sectionId: section.sectionId, type: section.type, schemaVersion: section.schemaVersion, data: section.data, draftData: null, removedAt: null, revision: 1 }))),
    collections, media: [],
  };
  return JSON.parse(JSON.stringify(bundle)) as typeof bundle;
}
