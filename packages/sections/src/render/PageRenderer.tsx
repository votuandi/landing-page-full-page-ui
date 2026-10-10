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
  /** Chuẩn bị dữ liệu thô trước khi parse (E5: truy vấn collection); kết quả được parse bằng schema của type. */
  loadData?: LoadSectionData;
};

type Prepared = { section: PageSection; Variant?: SectionVariant<any>; data?: unknown };

async function prepare(section: PageSection, { site, registry = sectionRegistry, loadData }: PageRendererProps):
  Promise<Prepared | null> {
  const def = registry.getType(section.type);
  const resolved = registry.getVariant(section.type, section.variant);
  if (!def || !resolved) return null;
  try {
    const [raw, { default: Variant }] = await Promise.all([
      loadData ? loadData({ section, data: section.data, site }) : section.data,
      resolved.load(),
    ]);
    return { section, Variant, data: def.schema.parse(raw) };
  } catch (error) {
    console.error("[sections] chuẩn bị section lỗi", {
      tenantId: site.tenantId, sectionId: section.id, type: section.type, variant: resolved.variant, error,
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
