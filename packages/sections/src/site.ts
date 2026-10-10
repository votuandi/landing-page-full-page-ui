// E5 mở rộng ngữ cảnh khi có repository tenant.
export type Locale = "vi" | "en";
export type SiteContext = { tenantId: string; locale: Locale; themeId: string };
