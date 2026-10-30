const basic = ["leadForm", "blog", "customDomain"] as const;
const pro = [...basic, "calculator", "quoteForm", "packages", "faq", "testimonials", "stats", "energyMonitoring", "investmentModels", "trust", "social", "leadWebhook", "leadInbox", "sectionReorder", "variantSwitch", "pageStructure", "landingPages"] as const;
const premium = [...pro, "shorts", "tiktok", "catalog", "quoteCart", "dealer", "branchMap", "press", "bilingual", "leadExport", "leadAssign", "themeOverride", "builder", "abTest", "videoUpload"] as const;
export const FEATURES = Object.freeze(premium);
export type Feature = typeof FEATURES[number];
export const PLAN_IDS = Object.freeze(["basic", "pro", "premium"] as const);
export type PlanId = typeof PLAN_IDS[number];
export type ThemeGroup = "classic" | "pro" | "signature";
export type LimitKey = "domains" | "mediaGb" | "pages" | "users";
export type PlanLimits = Readonly<Record<LimitKey, number>>;
export type PlanDefinition = Readonly<{
  id: PlanId;
  name: string;
  themes: readonly ThemeGroup[];
  features: ReadonlySet<Feature>;
  limits: PlanLimits;
}>;

// A frozen Set still allows add/delete; expose only reads, including forEach's set argument.
function readonlyFeatures(values: readonly Feature[]): ReadonlySet<Feature> {
  const set = new Set(values);
  const view: ReadonlySet<Feature> = Object.freeze({
    size: set.size,
    has: (value: Feature) => set.has(value),
    entries: () => set.entries(), keys: () => set.keys(), values: () => set.values(),
    [Symbol.iterator]: () => set[Symbol.iterator](),
    forEach: (callback: (value: Feature, key: Feature, set: ReadonlySet<Feature>) => void, thisArg?: unknown) => {
      set.forEach(value => callback.call(thisArg, value, value, view));
    },
  });
  return view;
}
export const plans: Readonly<Record<PlanId, PlanDefinition>> = Object.freeze({
  basic: Object.freeze({ id: "basic", name: "Cơ bản", themes: Object.freeze(["classic"] as const), features: readonlyFeatures(basic), limits: Object.freeze({ domains: 1, mediaGb: 1, pages: 1, users: 1 }) }),
  pro: Object.freeze({ id: "pro", name: "Nâng cao", themes: Object.freeze(["classic", "pro"] as const), features: readonlyFeatures(pro), limits: Object.freeze({ domains: 1, mediaGb: 5, pages: 3, users: 3 }) }),
  premium: Object.freeze({ id: "premium", name: "Cao cấp", themes: Object.freeze(["classic", "pro", "signature"] as const), features: readonlyFeatures(premium), limits: Object.freeze({ domains: 3, mediaGb: 20, pages: 20, users: 10 }) }),
});
export function isFeature(value: string): value is Feature { return (FEATURES as readonly string[]).includes(value); }
export function isPlanId(value: string): value is PlanId { return (PLAN_IDS as readonly string[]).includes(value); }
export function getPlan(id: string): PlanDefinition | undefined { return isPlanId(id) ? plans[id] : undefined; }
export function themeAllowed(planId: string, group: ThemeGroup): boolean { return getPlan(planId)?.themes.includes(group) ?? false; }

export const featureLabels: Readonly<Record<Feature, string>> = Object.freeze({
  leadAssign: "Phân công lead",
  leadForm: "Form liên hệ/tư vấn", blog: "Tin tức", customDomain: "Tên miền riêng + SSL",
  calculator: "Máy tính chi phí", quoteForm: "Form nhận báo giá", packages: "Gói giải pháp", faq: "Câu hỏi thường gặp", testimonials: "Đánh giá khách hàng", stats: "Số liệu", energyMonitoring: "Giám sát năng lượng / biểu đồ phụ tải", investmentModels: "Mô hình đầu tư", trust: "Chứng nhận / uy tín", social: "Mạng xã hội", leadWebhook: "Lead Webhook / Google Sheets", leadInbox: "Hộp thư lead", sectionReorder: "Sắp xếp section", variantSwitch: "Đổi variant", pageStructure: "Chọn cấu trúc trang",
  shorts: "Video Shorts", tiktok: "TikTok", catalog: "Danh mục sản phẩm", quoteCart: "Giỏ báo giá", dealer: "Đại lý", branchMap: "Bản đồ chi nhánh", press: "Báo chí", bilingual: "Song ngữ VI/EN", leadExport: "Xuất lead", themeOverride: "Override màu/font", builder: "Builder kéo-thả", landingPages: "Trang landing", abTest: "A/B CTA", videoUpload: "Video tự host",
});
export const limitLabels: Readonly<Record<LimitKey, string>> = Object.freeze({ domains: "Số tên miền", mediaGb: "Media (GB)", pages: "Số trang do khách tạo", users: "Số người dùng" });
export const themeLabels: Readonly<Record<ThemeGroup, string>> = Object.freeze({ classic: "Classic (minwy, t02–t04)", pro: "Pro (t05–t11)", signature: "Signature (t12–t15)" });
export const featureDependencies: Readonly<Partial<Record<Feature, readonly Feature[]>>> = Object.freeze({ quoteCart: Object.freeze(["catalog"] as const) });
