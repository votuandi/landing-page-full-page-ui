// Tách khỏi pageSections.ts: component client import được mà không kéo @solar/db vào bundle.
export const BUILDER_TYPES = ["hero", "calculator", "projects", "faq", "cta-banner"] as const;
