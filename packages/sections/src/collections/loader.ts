import { sectionRegistry, type SectionRegistry } from "../registry";
import type { LoadSectionData } from "../render/PageRenderer";
import type { SiteContext } from "../site";
import type { CollectionName } from "./schemas";
import { applyCollectionQuery } from "./query";

export type CollectionSource = Partial<Record<CollectionName, (site: SiteContext) => Promise<unknown[]> | unknown[]>>;

export function createCollectionLoader(source: CollectionSource, registry: SectionRegistry = sectionRegistry): LoadSectionData {
  return async ({ section, data, site }) => {
    const name = registry.getType(section.type)?.meta.collections?.[0] as CollectionName | undefined;
    if (!name || !source[name]) return data;
    const def = registry.getType(section.type)!;
    // Parse configuration before querying; PageRenderer validates loaded items afterwards.
    const config = def.schema.parse(data) as { query: Parameters<typeof applyCollectionQuery>[1] };
    const items = await source[name](site);
    return { ...config, items: applyCollectionQuery(items as { id: string }[], config.query) };
  };
}
