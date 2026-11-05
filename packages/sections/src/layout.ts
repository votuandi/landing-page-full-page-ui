import { z } from "zod";

export const sectionLayoutSchema = z.strictObject({
  background: z.enum(["default", "tint", "sky", "sun", "deep", "invert"]).optional(),
  spacing: z.enum(["compact", "normal", "loose"]).optional(),
  align: z.enum(["start", "center"]).optional(),
  hideOn: z.enum(["mobile", "desktop"]).optional(),
});
export type SectionLayout = z.output<typeof sectionLayoutSchema>;
export type LayoutCapability = "background" | "spacing" | "align";

export function resolveLayout(layout: SectionLayout | undefined, caps: readonly LayoutCapability[]): SectionLayout | undefined {
  if (!layout) return undefined;
  const next: SectionLayout = {};
  if (caps.includes("background") && layout.background && layout.background !== "default") next.background = layout.background;
  if (caps.includes("spacing") && layout.spacing && layout.spacing !== "normal") next.spacing = layout.spacing;
  if (caps.includes("align") && layout.align === "center") next.align = layout.align;
  if (layout.hideOn) next.hideOn = layout.hideOn;
  return Object.keys(next).length ? next : undefined;
}

export function wrapperLayout(layout?: SectionLayout): { className?: string; "data-surface"?: "deep" | "invert" } {
  const surface = layout?.background === "deep" || layout?.background === "invert" ? layout.background : undefined;
  const hidden = layout?.hideOn === "mobile" ? "max-md:hidden" : layout?.hideOn === "desktop" ? "md:hidden" : "";
  const className = [surface ? "bg-bg text-fg" : "", hidden].filter(Boolean).join(" ");
  return { ...(className ? { className } : {}), ...(surface ? { "data-surface": surface } : {}) };
}
export function surfaceClass(background: SectionLayout["background"], fallback: string): string {
  switch (background) {
    case "tint": return "bg-bg-tint";
    case "sky": return "bg-bg-sky";
    case "sun": return "bg-bg-sun";
    default: return fallback;
  }
}
export function spacingClass(spacing: SectionLayout["spacing"], fallback: string): string {
  switch (spacing) {
    case "compact": return fallback === "t15-section" ? "min-h-section py-10 md:py-14" : "py-10 md:py-14";
    case "loose": return fallback === "t15-section" ? "min-h-section py-24 md:py-32" : "py-24 md:py-32";
    default: return fallback;
  }
}
export const LAYOUT_CLASSES = ["bg-bg-tint", "bg-bg-sky", "bg-bg-sun", "bg-bg", "text-fg", "max-md:hidden", "md:hidden", "min-h-section", "py-10", "md:py-14", "py-24", "md:py-32", "text-center", "mx-auto"] as const;
