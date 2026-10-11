import { parseTheme } from "@solar/tokens";

/** template-8 globals.css: navy, sun yellow, sky/beige and frosted glass. */
export const t08 = parseTheme({
  colors: {
    light: {
      bg: "255 255 255", "bg-elevated": "255 255 255", "bg-tint": "248 242 231",
      "bg-sky": "219 233 255", "bg-sun": "248 242 231", "bg-deep": "239 227 204",
      glass: "rgba(255,255,255,0.6)", "glass-border": "rgba(255,255,255,0.7)",
      "glass-strong": "rgba(255,255,255,0.8)", "glass-strong-border": "rgba(13,59,120,0.14)",
      "glass-tint": "255 255 255",
      primary: "13 59 120", "primary-strong": "11 31 58", "primary-deep": "11 31 58",
      leaf: "52 211 153", secondary: "47 111 228", "secondary-deep": "29 91 184", sky: "47 111 228",
      "on-primary": "255 255 255", "on-secondary": "255 255 255",
      accent: "247 185 40", "accent-soft": "255 214 102", "accent-ink": "146 64 14", "on-accent": "11 31 58",
      fg: "11 31 58", "fg-muted": "71 85 105", "fg-subtle": "87 100 120", line: "13 59 120",
      "on-media": "255 255 255", scrim: "7 22 40", shadow: "13 59 120",
      success: "4 120 87", danger: "185 28 28", "chart-a": "247 185 40", "chart-b": "47 111 228",
      skin: "241 199 163", "skin-shade": "223 169 130", "skin-light": "248 220 196", device: "15 23 42",
    },
    dark: {
      bg: "11 18 32", "bg-elevated": "17 28 44", "bg-tint": "15 26 41",
      "bg-sky": "15 26 41", "bg-sun": "17 28 44", "bg-deep": "7 22 40",
      glass: "rgba(255,255,255,0.1)", "glass-border": "rgba(255,255,255,0.15)",
      "glass-strong": "rgba(255,255,255,0.15)", "glass-strong-border": "rgba(255,255,255,0.2)",
      primary: "147 197 253", "primary-strong": "191 219 254", "primary-deep": "7 22 40",
      secondary: "147 197 253", "secondary-deep": "191 219 254",
      "on-primary": "11 31 58", "on-secondary": "11 31 58",
      "accent-ink": "255 214 102", fg: "229 237 248", "fg-muted": "168 183 200", "fg-subtle": "159 176 196",
      line: "255 255 255", success: "52 211 153", danger: "248 113 113",
    },
  },
  font: { sans: "Inter", display: "Inter", weights: [400, 600, 800, 900], source: "google" },
  radius: { card: "28px", pill: "9999px", media: "32px", input: "14px", button: "9999px" },
  shadow: { strength: 1, tint: "shadow" },
  glass: { blur: 24, enabled: true },
  motion: {
    durationFast: 300, durationBase: 500, durationSlow: 900,
    easing: "cubic-bezier(.16,1,.3,1)", revealDistance: 80, revealEnabled: true,
  },
  density: { sectionY: "md", container: 1280 },
  meta: { id: "t08", name: "Glass & Arch", group: "pro", supportsDark: true },
});
