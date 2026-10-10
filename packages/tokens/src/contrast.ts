import { ThemeOverridesSchema, type ThemeOverrides } from "./css";
import { RgbChannels, type ColorKey, type ColorSet, type ThemeTokens } from "./schema";

export const AA_NORMAL = 4.5;

function channels(color: string): number[] {
  return RgbChannels.parse(color).split(" ").map(Number);
}

function luminance(color: string): number {
  const linear = channels(color).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

export function contrastRatio(a: string, b: string): number {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function suggestAccessible(color: string, against: string, min = AA_NORMAL): string {
  if (contrastRatio(color, against) >= min) return color;
  const original = channels(color);
  let closest: { color: string; amount: number } | undefined;
  for (const target of [0, 255]) {
    const mix = (amount: number) => original
      .map((channel) => Math.round(channel + amount * (target - channel))).join(" ");
    if (contrastRatio(mix(1), against) < min) continue;
    let low = 0;
    let high = 1;
    // Check rounded channels throughout the search so the returned RGB still passes.
    for (let step = 0; step < 40; step++) {
      const middle = (low + high) / 2;
      if (contrastRatio(mix(middle), against) >= min) high = middle;
      else low = middle;
    }
    if (!closest || high < closest.amount) closest = { color: mix(high), amount: high };
  }
  return closest?.color ?? (contrastRatio("0 0 0", against) >= contrastRatio("255 255 255", against)
    ? "0 0 0" : "255 255 255");
}

export type ContrastPair = { fg: ColorKey; bg: ColorKey; scrimAlpha?: number };
export type ContrastIssue = ContrastPair & {
  mode: "light" | "dark";
  ratio: number;
  min: number;
  suggestion: string;
};

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  ...(["fg", "fg-muted", "fg-subtle"] as const).flatMap((fg) =>
    (["bg", "bg-elevated", "bg-tint", "bg-sky", "bg-sun"] as const).map((bg) => ({ fg, bg }))),
  { fg: "on-primary", bg: "primary" },
  { fg: "on-secondary", bg: "secondary" },
  { fg: "on-accent", bg: "accent" },
  { fg: "accent-ink", bg: "bg" },
  { fg: "accent-ink", bg: "bg-elevated" },
  { fg: "on-media", bg: "scrim", scrimAlpha: 0.6 },
];

export function checkContrast(theme: ThemeTokens, overrides?: ThemeOverrides): ContrastIssue[] {
  const parsed = ThemeOverridesSchema.parse(overrides === undefined ? {} : overrides);
  const light = { ...theme.colors.light, ...parsed.colors?.light };
  const modes: { mode: "light" | "dark"; colors: ColorSet }[] = [{ mode: "light", colors: light }];
  if (theme.meta.supportsDark) {
    modes.push({ mode: "dark", colors: { ...light, ...theme.colors.dark, ...parsed.colors?.dark } });
  }
  const issues: ContrastIssue[] = [];
  for (const { mode, colors } of modes) {
    for (const pair of CONTRAST_PAIRS) {
      const foreground = colors[pair.fg];
      let background = colors[pair.bg];
      if (pair.scrimAlpha !== undefined) {
        const alpha = pair.scrimAlpha;
        const scrim = channels(background);
        const composites = [0, 255].map((base) => scrim
          .map((channel) => Math.round(channel * alpha + base * (1 - alpha))).join(" "));
        background = contrastRatio(foreground, composites[0]) <= contrastRatio(foreground, composites[1])
          ? composites[0] : composites[1];
      }
      const ratio = contrastRatio(foreground, background);
      if (ratio < AA_NORMAL) {
        issues.push({ ...pair, mode, ratio, min: AA_NORMAL, suggestion: suggestAccessible(foreground, background) });
      }
    }
  }
  return issues;
}
