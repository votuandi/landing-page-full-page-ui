import { parseTheme } from "@solar/tokens";

export const t11 = parseTheme({
  colors: {
    light: {
      bg: "255 255 255", "bg-elevated": "255 255 255", "bg-tint": "247 251 244",
      "bg-sky": "220 252 231", "bg-sun": "254 249 195", "bg-deep": "20 83 45",
      glass: "rgba(255,255,255,0.9)", "glass-border": "rgba(226,235,224,0.9)",
      "glass-strong": "rgba(255,255,255,0.14)", "glass-strong-border": "rgba(255,255,255,0.24)", "glass-tint": "21 128 61",
      primary: "21 128 61", "primary-strong": "20 83 45", "primary-deep": "20 83 45",
      leaf: "21 128 61", secondary: "20 83 45", "secondary-deep": "20 83 45", sky: "220 252 231",
      "on-primary": "255 255 255", "on-secondary": "255 255 255",
      accent: "250 204 21", "accent-soft": "254 249 195", "accent-ink": "139 95 3", "on-accent": "26 46 31",
      fg: "26 46 31", "fg-muted": "91 107 96", "fg-subtle": "91 107 96", line: "226 235 224",
      "on-media": "255 255 255", scrim: "12 30 20", shadow: "20 83 45", success: "21 128 61", danger: "159 18 57",
      "chart-a": "250 204 21", "chart-b": "21 128 61",
      skin: "241 199 163", "skin-shade": "223 169 130", "skin-light": "248 220 196", device: "26 46 31",
    },
    dark: {
      bg: "12 30 20", "bg-elevated": "12 30 20", "bg-tint": "19 44 27", "bg-sky": "19 44 27", "bg-sun": "19 44 27", "bg-deep": "12 30 20",
      fg: "243 251 241", "fg-muted": "190 210 190", "fg-subtle": "190 210 190", line: "49 86 58",
      primary: "74 222 128", "primary-strong": "74 222 128", secondary: "74 222 128", leaf: "74 222 128",
      "on-primary": "12 30 20", "on-secondary": "12 30 20", "accent-ink": "250 204 21",
      glass: "rgba(19,44,27,0.9)", "glass-border": "rgba(49,86,58,0.9)", "glass-tint": "74 222 128",
      success: "74 222 128", danger: "252 165 165", "chart-b": "74 222 128",
    },
  },
  font: { sans: "Be Vietnam Pro", display: "Manrope", weights: [400, 600, 800], source: "local" },
  radius: { card: "12px", pill: "9999px", media: "12px", input: "8px", button: "8px" },
  shadow: { strength: 0.4, tint: "shadow" }, glass: { blur: 12, enabled: true },
  motion: { durationFast: 200, durationBase: 300, durationSlow: 700, easing: "cubic-bezier(.16,1,.3,1)", revealDistance: 24, revealEnabled: true },
  density: { sectionY: "md", container: 1240 },
  meta: { id: "t11", name: "Hóa đơn → gói", group: "pro", supportsDark: true },
});
