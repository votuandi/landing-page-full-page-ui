/** Danh mục trang của site (D21 §2). Trang `page` có section lưu ở bảng Page; `collection`/`policy` do code render. */
export type PageTypeDef = {
  label: { vi: string; en?: string };
  slug: string;
  kind: "page" | "collection" | "policy";
  required?: boolean;
  entitlement?: string;
  collection?: "product" | "service" | "project" | "post";
  /** Section mặc định khi dựng trang `page` (trừ home: lấy từ preset). */
  sections?: readonly string[];
};

const defs = {
  home: { label: { vi: "Trang chủ" }, slug: "", kind: "page", required: true },
  about: { label: { vi: "Về chúng tôi" }, slug: "ve-chung-toi", kind: "page", sections: ["about-story", "stats", "trust", "warranty"] },
  services: { label: { vi: "Giải pháp" }, slug: "giai-phap", kind: "collection", collection: "service" },
  projects: { label: { vi: "Công trình" }, slug: "cong-trinh", kind: "collection", collection: "project" },
  products: { label: { vi: "Sản phẩm" }, slug: "san-pham", kind: "collection", collection: "product", entitlement: "catalog" },
  news: { label: { vi: "Tin tức" }, slug: "tin-tuc", kind: "collection", collection: "post", entitlement: "blog" },
  guides: { label: { vi: "Cẩm nang" }, slug: "cam-nang", kind: "page", entitlement: "blog", sections: [] },
  contact: { label: { vi: "Liên hệ" }, slug: "lien-he", kind: "page", required: true, sections: ["lead-form", "branch-map"] },
  policy: { label: { vi: "Chính sách" }, slug: "chinh-sach", kind: "policy", required: true },
} as const satisfies Record<string, PageTypeDef>;

export type PageTypeId = keyof typeof defs;
export const PAGE_TYPES: Readonly<Record<PageTypeId, PageTypeDef>> = defs;
export const PAGE_TYPE_IDS = Object.keys(PAGE_TYPES) as PageTypeId[];

export function isPageType(value: string): value is PageTypeId {
  return Object.prototype.hasOwnProperty.call(PAGE_TYPES, value);
}

/** Loại trang sở hữu một route; slug ngoài danh mục là trang landing (theo bản ghi Page). */
export function pageTypeOfRoute(route: { kind: "page"; slug: string } | { kind: "list" | "detail"; collection: string } | { kind: "policy" }): PageTypeId | null {
  if (route.kind === "policy") return "policy";
  const match = PAGE_TYPE_IDS.find((id) => {
    const def = PAGE_TYPES[id];
    return route.kind === "page" ? def.kind === "page" && def.slug === route.slug : def.collection === route.collection;
  });
  return match ?? null;
}
