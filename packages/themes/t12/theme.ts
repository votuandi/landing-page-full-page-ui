import { parseTheme } from "@solar/tokens";

/** template-12 globals.css: Sky & Sun (light), Emerald Dusk (dark). */
export const t12 = parseTheme({
  colors: {
    light: {
      bg: "244 248 251", "bg-elevated": "255 255 255", "bg-tint": "230 241 246",
      "bg-sky": "230 241 246", "bg-sun": "255 248 230", "bg-deep": "226 239 245",
      glass: "rgba(255,255,255,0.72)", "glass-border": "rgba(14,116,144,0.15)",
      "glass-strong": "rgba(255,255,255,0.8)", "glass-strong-border": "rgba(14,116,144,0.14)",
      "glass-tint": "14 116 144",
      primary: "14 116 144", "primary-strong": "21 94 117", "primary-deep": "220 238 242",
      leaf: "16 185 129", secondary: "14 116 144", "secondary-deep": "21 94 117", sky: "56 189 248",
      "on-primary": "255 255 255", "on-secondary": "255 255 255",
      accent: "245 158 11", "accent-soft": "180 83 9", "accent-ink": "180 83 9", "on-accent": "15 23 42",
      fg: "15 23 42", "fg-muted": "71 85 105", "fg-subtle": "87 100 120", line: "14 116 144",
      "on-media": "255 255 255", scrim: "4 14 12", shadow: "15 52 70",
      success: "4 120 87", danger: "185 28 28", "chart-a": "245 184 61", "chart-b": "14 116 144",
      skin: "241 199 163", "skin-shade": "223 169 130", "skin-light": "248 220 196", device: "30 41 59",
    },
    dark: {
      bg: "11 31 28", "bg-elevated": "16 42 38", "bg-tint": "13 50 43",
      "bg-sky": "16 42 38", "bg-sun": "13 50 43", "bg-deep": "7 22 19",
      glass: "rgba(255,255,255,0.06)", "glass-border": "rgba(255,255,255,0.12)",
      "glass-strong": "rgba(255,255,255,0.10)", "glass-strong-border": "rgba(255,255,255,0.15)",
      "glass-tint": "255 255 255",
      primary: "16 185 129", "primary-strong": "5 150 105", "primary-deep": "6 78 59",
      secondary: "16 185 129", "secondary-deep": "6 78 59",
      "on-primary": "4 28 21", "on-secondary": "4 28 21",
      accent: "245 184 61", "accent-soft": "249 210 122", "accent-ink": "249 210 122", "on-accent": "11 31 28",
      fg: "232 243 239", "fg-muted": "159 184 177", "fg-subtle": "138 165 158", line: "255 255 255",
      shadow: "1 8 6", success: "52 211 153", danger: "248 113 113", "chart-b": "16 185 129",
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
  meta: { id: "t12", name: "Sky & Sun", group: "signature", supportsDark: true },
});
