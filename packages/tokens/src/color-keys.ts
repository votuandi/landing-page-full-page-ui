// Dùng chung cho schema và preset để bộ nạp Tailwind không phải nạp Zod.
export const COLOR_KEYS = [
  "bg", "bg-elevated", "bg-deep", "bg-tint", "bg-sky", "bg-sun",
  "primary", "primary-strong", "primary-deep", "secondary", "secondary-deep", "leaf",
  "sky", "accent", "accent-soft", "accent-ink", "on-primary", "on-secondary", "on-accent",
  "on-media", "fg", "fg-muted", "fg-subtle", "line", "scrim", "shadow", "success", "danger",
  "chart-a", "chart-b", "skin", "skin-shade", "skin-light", "device", "glass-tint",
] as const;

export const GLASS_COLOR_KEYS = ["glass", "glass-border", "glass-strong", "glass-strong-border"] as const;
