import { PAGE_TYPES, pageTypeOfRoute } from "@solar/presets";

const collections = { "san-pham": "product", "cong-trinh": "project", "giai-phap": "service", "tin-tuc": "post" } as const;
export type Route = { kind: "page"; slug: string } | { kind: "list" | "detail"; collection: "product" | "project" | "service" | "post"; slug: string } | { kind: "policy"; slug: string };
export function resolveRoute(path: string[]): Route | null {
  if (path.some((part) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part) || part.length > 200)) return null;
  const [prefix, slug] = path;
  if (prefix && Object.hasOwn(collections, prefix)) {
    const collection = collections[prefix as keyof typeof collections];
    if (path.length === 2) return { kind: "detail", collection, slug };
    return path.length === 1 && collection !== "project" ? { kind: "list", collection, slug: "" } : null;
  }
  if (prefix === "chinh-sach") return path.length === 2 ? { kind: "policy", slug } : null;
  if (["sites", "api", "lab"].includes(prefix)) return null;
  return { kind: "page", slug: path.join("/") };
}

/** Route mở khi loại trang có trong cấu trúc site và được gói cho phép (D21); slug landing theo bản ghi Page. */
export function routeEnabled(route: Route, pageTypes: readonly string[], canUse: (feature: string) => boolean) {
  const type = pageTypeOfRoute(route);
  if (!type) return true;
  const entitlement = PAGE_TYPES[type].entitlement;
  return pageTypes.includes(type) && (!entitlement || canUse(entitlement));
}
