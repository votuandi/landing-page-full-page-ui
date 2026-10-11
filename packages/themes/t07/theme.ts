import { parseTheme } from "@solar/tokens";

/** Template-7: xanh dương/vàng/be; màu chữ phụ đã tăng tương phản để đạt AA. */
export const t07 = parseTheme({
  colors: { light: {
    bg: "249 246 239", "bg-elevated": "255 255 255", "bg-tint": "245 249 254",
    "bg-sky": "237 246 255", "bg-sun": "255 240 193", "bg-deep": "24 55 88",
    glass: "rgba(255,255,255,0.78)", "glass-border": "rgba(24,55,88,0.14)",
    "glass-strong": "rgba(255,255,255,0.14)", "glass-strong-border": "rgba(255,255,255,0.24)",
    "glass-tint": "21 91 215",
    primary: "21 91 215", "primary-strong": "23 77 148", "primary-deep": "24 55 88",
    leaf: "59 141 119", secondary: "31 86 168", "secondary-deep": "24 55 88", sky: "122 165 232",
    "on-primary": "255 255 255", "on-secondary": "255 255 255",
    accent: "243 199 92", "accent-soft": "255 240 193", "accent-ink": "133 84 0", "on-accent": "24 55 88",
    fg: "24 55 88", "fg-muted": "80 98 119", "fg-subtle": "84 105 125", line: "207 222 238",
    "on-media": "255 255 255", scrim: "7 27 51", shadow: "42 80 118",
    success: "38 116 96", danger: "185 28 28", "chart-a": "133 84 0", "chart-b": "31 86 168",
    skin: "241 199 163", "skin-shade": "223 169 130", "skin-light": "248 220 196", device: "24 55 88",
  } },
  font: { sans: "Inter", display: "Inter", weights: [400, 600, 800], source: "google" },
  radius: { card: "20px", pill: "9999px", media: "32px", input: "14px", button: "9999px" },
  shadow: { strength: 1, tint: "shadow" },
  glass: { blur: 16, enabled: true },
  motion: { durationFast: 250, durationBase: 500, durationSlow: 850, easing: "cubic-bezier(.2,.65,.25,1)", revealDistance: 64, revealEnabled: true },
  density: { sectionY: "screen", container: 1200 },
  meta: { id: "t07", name: "Solar cho mọi công trình", group: "pro", supportsDark: false },
});
