import type { SectionVariant } from "../define";
import type { PageConfig, PageSection } from "../page";
import { sectionRegistry, type SectionRegistry } from "../registry";
import type { SiteContext } from "../site";
import { SectionBoundary } from "./SectionBoundary";

export type LoadSectionData = (input: { section: PageSection; data: unknown; site: SiteContext }) => unknown;

export type PageRendererProps = {
  page: PageConfig;
  site: SiteContext;
  registry?: SectionRegistry;
  /** E6 thay bằng `(feature) => can(site, feature)`. */
  canUse?: (feature: string) => boolean;
  /** Hydrate config đã parse (E5: truy vấn collection); kết quả được kiểm schema lần nữa. */
  loadData?: LoadSectionData;
  /** Trusted server resolver, after validation (e.g. tenant Media UUID → public URL). */
  resolveData?: LoadSectionData;
};

type Prepared = { section: PageSection; Variant?: SectionVariant<any>; data?: unknown };

async function prepare(section: PageSection, { site, registry = sectionRegistry, loadData, resolveData }: PageRendererProps):
  Promise<Prepared | null> {
  const def = registry.getType(section.type);
  const resolved = registry.getVariant(section.type, section.variant);
  if (!def || !resolved) return null;
  const parse = (raw: unknown) => {
    const result = def.schema.safeParse(raw);
    if (result.success) return result.data;
    console.error("[sections] dùng defaults section", { tenantId: site.tenantId, sectionId: section.id, type: section.type });
    return def.schema.parse(def.defaults);
  };
  try {
    const config = parse(section.data);
    const [raw, { default: Variant }] = await Promise.all([
      loadData ? loadData({ section, data: config, site }) : config,
      resolved.load(),
    ]);
    const data = parse(raw);
    return { section, Variant, data: resolveData ? await resolveData({ section, data, site }) : data };
  } catch (error) {
    console.error("[sections] chuẩn bị section lỗi", {
      tenantId: site.tenantId, sectionId: section.id, type: section.type, variant: resolved.variant, error: error instanceof Error ? error.name : "Error",
    });
    return { section };
  }
}

/**
 * Render trang theo thứ tự cấu hình. Dữ liệu và module variant chuẩn bị song song; mỗi section có error boundary riêng
 * nên một section lỗi chỉ để lại wrapper rỗng, trang vẫn 200. Lỗi render Server Component của variant trên server không
 * được bắt ở đây — việc dễ lỗi (I/O, parse) phải nằm trong `loadData`. Không bọc Suspense: island `next/dynamic` suspend
 * khi SSR, Suspense sẽ stream section vào `<div hidden>` và nội dung biến mất khi tắt JavaScript.
 */
export async function PageRenderer(props: PageRendererProps) {
  const { page, site, registry = sectionRegistry, canUse = () => true } = props;
  const visible = page.sections.filter((section) => {
    if (!section.enabled) return false;
    const entitlement = registry.getType(section.type)?.meta.entitlement;
    return !entitlement || canUse(entitlement);
  });
  const prepared = await Promise.all(visible.map((section) => prepare(section, props)));

  return prepared.map((item) => {
    if (!item) return null;
    const { section, Variant, data } = item;
    return (
      <div key={section.id} id={section.anchor} data-section-id={section.id} data-section-type={section.type}
        data-section-fallback={Variant ? undefined : ""}>
        {Variant && (
          <SectionBoundary tenantId={site.tenantId} sectionId={section.id} type={section.type}>
            <Variant data={data} site={site} sectionId={section.id} />
          </SectionBoundary>
        )}
      </div>
    );
  });
}
