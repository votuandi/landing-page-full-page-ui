import { z } from "zod";
import { COLOR_KEYS, ColorSetSchema, GLASS_COLOR_KEYS, type ColorSet, type ThemeTokens } from "./schema";

export const ThemeOverridesSchema = z.strictObject({
  colors: z.strictObject({
    light: ColorSetSchema.partial().optional(),
    dark: ColorSetSchema.partial().optional(),
  }).optional(),
});
export type ThemeOverrides = z.infer<typeof ThemeOverridesSchema>;

function colorDeclarations(colors: Partial<ColorSet>, overrides?: Partial<ColorSet>): string[] {
  return [
    ...COLOR_KEYS.flatMap((key) => {
      const value = overrides?.[key] ?? colors[key];
      return value === undefined ? [] : [`--c-${key}:${value}`];
    }),
    ...GLASS_COLOR_KEYS.flatMap((key) => {
      const value = overrides?.[key] ?? colors[key];
      return value === undefined ? [] : [`--${key}:${value}`];
    }),
  ];
}

export function themeToCss(theme: ThemeTokens, overrides?: ThemeOverrides): string {
  const parsed = ThemeOverridesSchema.parse(overrides === undefined ? {} : overrides);
  // Easing is the only emitted free-form string in an otherwise parsed theme.
  if (/[<>{};]/.test(theme.motion.easing)) throw new Error("motion.easing chứa ký tự CSS không an toàn");

  const light = [
    ...colorDeclarations(theme.colors.light, parsed.colors?.light),
    ...Object.entries(theme.radius).map(([key, value]) => `--radius-${key}:${value}`),
    `--shadow-strength:${theme.shadow.strength}`,
    `--c-shadow-tint:var(--c-${theme.shadow.tint})`,
    `--glass-blur:${theme.glass.enabled ? theme.glass.blur : 0}px`,
    `--motion-fast:${theme.motion.durationFast}ms`,
    `--motion-base:${theme.motion.durationBase}ms`,
    `--motion-slow:${theme.motion.durationSlow}ms`,
    `--motion-ease:${theme.motion.easing}`,
    `--reveal-distance:${theme.motion.revealEnabled ? theme.motion.revealDistance : 0}px`,
    `--container:${theme.density.container}px`,
    "color-scheme:light",
  ].join(";");
  const css = `:root,[data-theme="light"]{${light}}`;
  if (!theme.meta.supportsDark) return css;

  const dark = [
    ...colorDeclarations(theme.colors.dark ?? {}, parsed.colors?.dark),
    "color-scheme:dark",
  ].join(";");
  return `${css}[data-theme="dark"]{${dark}}@media (prefers-color-scheme:dark){:root:not([data-theme]){${dark}}}`;
}
