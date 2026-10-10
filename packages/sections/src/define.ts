import type { ReactNode } from "react";
import type { z } from "zod";
import type { SiteContext } from "./site";

export type LocalizedText = { vi: string; en?: string };
export type SectionMeta = {
  label: LocalizedText;
  icon: string;
  entitlement?: string; // E6 thu hẹp thành Feature của @solar/plans.
  maxPerPage?: number;
  collections?: readonly string[];
};

export type SectionTypeDef<T extends string = string, S extends z.ZodType = z.ZodType> = {
  type: T;
  schemaVersion: number;
  schema: S;
  defaults: z.output<S>;
  meta: SectionMeta;
};

export function defineSectionType<const T extends string, S extends z.ZodType>(
  def: SectionTypeDef<T, S>,
): SectionTypeDef<T, S> {
  return def;
}

export type SectionPropsOf<D extends SectionTypeDef> = {
  data: z.output<D["schema"]>;
  site: SiteContext;
  sectionId: string;
};
export type SectionVariant<D extends SectionTypeDef> =
  (props: SectionPropsOf<D>) => ReactNode | Promise<ReactNode>;
export type VariantLoader<D extends SectionTypeDef> = () => Promise<{ default: SectionVariant<D> }>;
export type SectionVariants<D extends SectionTypeDef, V extends string> = {
  def: D;
  defaultVariant: V;
  variants: Record<V, VariantLoader<D>>;
};

export function defineVariants<D extends SectionTypeDef, const V extends string>(
  def: D,
  defaultVariant: NoInfer<V>,
  variants: Record<V, VariantLoader<NoInfer<D>>>,
): SectionVariants<D, V> {
  return { def, defaultVariant, variants };
}
