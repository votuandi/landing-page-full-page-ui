/** One representative of every page type; slugs deliberately do not import app code. */
export const routes = [
  "/",
  "/cam-nang",
  "/giai-phap",
  "/lien-he",
  "/san-pham",
  "/tin-tuc",
  "/ve-chung-toi",
  // apps/web/src/config/site.config.ts: siteConfig.legal.policies[0]
  "/chinh-sach/bao-hanh",
  // apps/web/src/data/projects.ts: PROJECTS[0]
  "/cong-trinh/nha-pho-binh-thanh",
  // apps/web/src/data/solar.ts: SERVICES[0]
  "/giai-phap/solar-nha-xuong",
  // apps/web/src/data/products.ts: PRODUCTS[0]
  // Catalog is ON by default (installer_distributor); both catalog pages return 200.
  "/san-pham/helionyx-nova-n-590w",
  // apps/web/src/data/posts.ts: POSTS[0]
  "/tin-tuc/tien-dien-2-trieu-nen-lap-bao-nhieu-kwp",
] as const;
