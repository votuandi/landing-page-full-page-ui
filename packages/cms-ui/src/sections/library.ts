import { sectionLimitIssues } from "@solar/sections";

export const LIBRARY_GROUPS = [
  { id: "opening", label: "Mở đầu", types: ["site-header", "hero", "page-hero", "segments"] },
  { id: "persuasion", label: "Thuyết phục", types: ["stats", "projects", "testimonials", "trust", "press", "brands", "shorts", "tiktok", "about-story"] },
  { id: "conversion", label: "Chuyển đổi", types: ["calculator", "lead-form", "packages", "cta-banner", "dealer", "investment-models"] },
  { id: "content", label: "Nội dung", types: ["services", "process", "products", "energy-monitoring", "load-profile", "warranty", "faq", "blog", "branch-map", "social"] },
  { id: "footer", label: "Chân trang", types: ["site-footer"] },
];
export type LibraryStatus = { kind: "ok" } | { kind: "locked" | "limit"; reason: string };

export function libraryStatus(type: string, sections: readonly { type: string; enabled?: boolean }[], allowedTypes: readonly string[], lockedTypes: readonly string[]): LibraryStatus {
  if (!allowedTypes.includes(type) || lockedTypes.includes(type)) return { kind: "locked", reason: "Cần nâng cấp gói" };
  const reason = sectionLimitIssues([...sections, { type }])[0];
  return reason ? { kind: "limit", reason } : { kind: "ok" };
}
