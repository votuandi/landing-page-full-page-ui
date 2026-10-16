import { PageRenderer, pageConfigSchema, sectionRegistry, type Locale, type SiteContext } from "@solar/sections";

// Luồng chuyển đổi t15 (E3-S04) render từ cấu hình + defaults (= fixture [DỮ LIỆU MẪU]) qua registry sản phẩm.
const order = [
  ["site-header", "dau-trang", undefined],
  ["hero", "mo-dau", undefined],
  ["segments", "phan-khuc", "phan-khuc"],
  ["packages", "goi", "goi-giai-phap"],
  ["calculator", "du-toan", "du-toan"],
  ["lead-form", "nhan-bao-gia", "nhan-bao-gia"],
  ["site-footer", "chan-trang", undefined],
] as const;

export default async function ConversionLabPage({ searchParams }: { searchParams: Promise<{ lang?: string; an?: string }> }) {
  const query = await searchParams;
  const hidden = new Set(query.an?.split(",") ?? []);
  const page = pageConfigSchema.parse({
    sections: order.filter(([type]) => !hidden.has(type)).map(([type, id, anchor]) => {
      const defaults = sectionRegistry.getType(type)?.defaults;
      const data = type === "segments" ? { ...sectionRegistry.types.segments.defaults, targetAnchor: "goi-giai-phap" } : defaults;
      return { id, type, variant: "t15", anchor, data };
    }),
  });
  const locale: Locale = query.lang === "en" ? "en" : "vi";
  const site: SiteContext = { tenantId: "lab-demo", locale, themeId: "t15" };
  return <PageRenderer page={page} site={site} />;
}
