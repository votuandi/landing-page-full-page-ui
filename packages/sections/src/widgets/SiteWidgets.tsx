import type { SectionVariant } from "../define";
import type { SectionRegistry } from "../registry";
import type { LoadSectionData } from "../render/PageRenderer";
import { SectionBoundary } from "../render/SectionBoundary";
import type { SiteContext } from "../site";
import type { SiteWidgetsConfig } from "./config";
import { widgetRegistry, WIDGET_SLOTS } from "./registry";

export type SiteWidgetsProps = {
  widgets: SiteWidgetsConfig; site: SiteContext; slot: "inline" | "overlay";
  canUse?: (feature: string) => boolean; loadData?: LoadSectionData; registry?: SectionRegistry;
};

/** E4 places inline widgets before the footer and overlays at the end of the body. */
export async function SiteWidgets({ widgets, site, slot, canUse = () => true, loadData, registry = widgetRegistry }: SiteWidgetsProps) {
  return Promise.all(Object.entries(widgets).map(async ([key, entry]) => {
    if (!entry?.enabled || WIDGET_SLOTS[key as keyof typeof WIDGET_SLOTS] !== slot) return null;
    const def = registry.getType(key);
    if (!def || (def.meta.entitlement && !canUse(def.meta.entitlement))) return null;
    let Variant: SectionVariant<any>;
    let data: unknown;
    try {
      const resolved = registry.getVariant(key, entry.variant);
      if (!resolved) return null;
      const section = { id: key, type: key, enabled: true, variant: resolved.variant, data: entry.data ?? def.defaults };
      const [raw, module] = await Promise.all([loadData ? loadData({ section, data: section.data, site }) : section.data, resolved.load()]);
      data = def.schema.parse(raw);
      Variant = module.default;
    } catch (error) {
      console.error("[sections] chuẩn bị widget lỗi", { tenantId: site.tenantId, sectionId: key, type: key, error });
      return null;
    }
    return <div key={key} data-widget={key}>
      <SectionBoundary tenantId={site.tenantId} sectionId={key} type={key}>
        <Variant data={data} site={site} sectionId={key} />
      </SectionBoundary>
    </div>;
  }));
}
