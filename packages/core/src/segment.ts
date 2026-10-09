export type Segment = "household" | "shop" | "factory" | "farm";

export const SEGMENT_ORDER: Segment[] = ["household", "shop", "factory", "farm"];

/** Slug là hợp đồng URL, độc lập với nội dung và theme. */
export const SEGMENT_SLUGS: Record<Segment, string> = {
  household: "ho-gia-dinh", shop: "cua-hang", factory: "nha-xuong", farm: "trang-trai",
};

export const isSegment = (value: unknown): value is Segment =>
  typeof value === "string" && SEGMENT_ORDER.some((segment) => segment === value);

/** "ho-gia-dinh" hoặc "household" → "household" */
export function segmentFromParam(value: string | null | undefined): Segment | null {
  if (!value) return null;
  if (isSegment(value)) return value;
  return SEGMENT_ORDER.find((s) => SEGMENT_SLUGS[s] === value) ?? null;
}

/** id các section trên trang chủ — dùng cho menu, CTA và cuộn trang. */
export const SECTION_IDS = {
  segments: "phan-khuc",
  video: "video-cong-trinh",
  packages: "goi-giai-phap",
  calculator: "du-toan",
  projects: "cong-trinh",
  products: "san-pham-noi-bat",
} as const;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Cuộn tới một section của trang chủ; đang ở trang khác thì chuyển về trang chủ. */
export function scrollToSection(id: string, segment?: Segment | null) {
  const el = document.getElementById(id);
  if (!el) {
    window.location.href = `/${segment ? `?phan-khuc=${segment}` : ""}#${id}`;
    return;
  }
  el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

