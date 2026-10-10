import type { SectionPropsOf, SectionTypeDef, SectionVariants, VariantLoader } from "./define";

// Registry trộn nhiều schema; defineVariants kiểm props trước khi xóa kiểu ở lookup bằng string.
export function createRegistry<E extends Record<string, SectionVariants<any, string>>>(entries: E) {
  const types = Object.fromEntries(Object.entries(entries).map(([key, entry]) => {
    if (key !== entry.def.type) {
      throw new Error(`[sections] key ${key} không trùng def.type ${entry.def.type}`);
    }
    return [key, entry.def];
  })) as { [K in keyof E]: E[K]["def"] };

  return {
    types,
    getType(type: string): SectionTypeDef | undefined {
      return Object.prototype.hasOwnProperty.call(entries, type) ? entries[type].def : undefined;
    },
    getVariant(type: string, variant: string): {
      type: string; variant: string; fallback: boolean; load: VariantLoader<any>;
    } | null {
      if (!Object.prototype.hasOwnProperty.call(entries, type)) {
        console.warn("[sections] type không tồn tại", { type, variant });
        return null;
      }
      const entry = entries[type];
      const fallback = !Object.prototype.hasOwnProperty.call(entry.variants, variant);
      if (fallback) {
        console.warn("[sections] variant không tồn tại", { type, variant, fallback: entry.defaultVariant });
      }
      const resolved = fallback ? entry.defaultVariant : variant;
      return { type, variant: resolved, fallback, load: entry.variants[resolved] };
    },
  };
}

export const sectionRegistry = createRegistry({});
export type SectionTypeName = keyof typeof sectionRegistry.types;
export type SectionProps<K extends SectionTypeName> = SectionPropsOf<(typeof sectionRegistry.types)[K]>;
export type SectionRegistry = ReturnType<typeof createRegistry>;
