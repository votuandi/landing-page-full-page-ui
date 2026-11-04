import { sectionRegistry, type SectionLayout } from "@solar/sections";

export function layoutOptions(type: string, variant: string, supportsDark: boolean) {
  const caps = sectionRegistry.layoutOf(type, variant);
  const options: { [K in "background" | "spacing" | "align"]?: NonNullable<SectionLayout[K]>[] } = {};
  if (caps.includes("background")) options.background = supportsDark ? ["default", "tint", "sky", "sun", "deep", "invert"] : ["default", "tint", "sky", "sun"];
  if (caps.includes("spacing")) options.spacing = ["compact", "normal", "loose"];
  if (caps.includes("align")) options.align = ["start", "center"];
  return options;
}

export function anchorError(value: string, sections: readonly { id: string; anchor?: string }[], id: string): string | undefined {
  if (!value) return undefined;
  if (!/^[a-z0-9-]+$/.test(value)) return "Chỉ dùng chữ thường, số và dấu gạch nối";
  if (sections.some(s => s.id !== id && s.anchor === value)) return "Mã neo đã dùng";
  return undefined;
}
