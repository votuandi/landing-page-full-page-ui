import { variants as services } from "./services";
import { variants as aboutStory } from "./about-story";
import { variants as warranty } from "./warranty";
import { variants as investmentModels } from "./investment-models";
import { variants as social } from "./social";
import { variants as tiktok } from "./tiktok";
import { variants as press } from "./press";
import { variants as branchMap } from "./branch-map";
import { variants as dealer } from "./dealer";
import { variants as products } from "./products";
import { variants as projects } from "./projects";
import { variants as shorts } from "./shorts";
import { variants as stats } from "./stats";
import { variants as energyMonitoring } from "./energy-monitoring";
import { variants as process } from "./process";
import { variants as testimonials } from "./testimonials";
import { variants as trust } from "./trust";
import { variants as brands } from "./brands";
import { variants as faq } from "./faq";
import { variants as blog } from "./blog";
import { variants as ctaBanner } from "./cta-banner";
import type { SectionPropsOf, SectionTypeDef, SectionVariants, VariantLoader } from "./define";
import { variants as calculator } from "./calculator";
import { variants as hero } from "./hero";
import { variants as leadForm } from "./lead-form";
import { variants as packages } from "./packages";
import { variants as segments } from "./segments";
import { variants as siteFooter } from "./site-footer";
import { variants as siteHeader } from "./site-header";

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

export const sectionRegistry = createRegistry({
  "products": products,
  "dealer": dealer,
  "branch-map": branchMap,
  "press": press,
  "tiktok": tiktok,
  "social": social,
  "investment-models": investmentModels,
  "warranty": warranty,
  "about-story": aboutStory,
  "services": services,
  "projects": projects,
  "shorts": shorts,
  "stats": stats,
  "energy-monitoring": energyMonitoring,
  "process": process,
  "testimonials": testimonials,
  "trust": trust,
  "brands": brands,
  "faq": faq,
  "blog": blog,
  "cta-banner": ctaBanner,
  "site-header": siteHeader,
  hero,
  segments,
  packages,
  calculator,
  "lead-form": leadForm,
  "site-footer": siteFooter,
});
export type SectionTypeName = keyof typeof sectionRegistry.types;
export type SectionProps<K extends SectionTypeName> = SectionPropsOf<(typeof sectionRegistry.types)[K]>;
export type SectionRegistry = ReturnType<typeof createRegistry>;
