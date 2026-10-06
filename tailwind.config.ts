import type { Config } from "tailwindcss";

/** Màu lấy từ CSS variable dạng kênh "R G B" trong globals.css → hỗ trợ bg-primary/20 … */
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Thay HẲN bảng màu mặc định của Tailwind: chỉ còn màu từ design tokens,
    // nên không thể vô tình dùng bg-white, text-slate-500… trong component.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
      bg: { DEFAULT: token("bg"), elevated: token("bg-elevated"), tint: token("bg-tint"), deep: token("bg-deep") },
      glass: { DEFAULT: "var(--glass)", border: "var(--glass-border)", strong: "var(--glass-strong)", "strong-border": "var(--glass-strong-border)" },
      primary: { DEFAULT: token("primary"), strong: token("primary-strong"), deep: token("primary-deep") },
      accent: token("accent"),
      "on-primary": token("on-primary"),
      "on-accent": token("on-accent"),
      "on-media": token("on-media"),
      fg: { DEFAULT: token("fg"), muted: token("fg-muted"), subtle: token("fg-subtle") },
      line: token("line"),
      sun: token("sun"),
      highlight: token("highlight"),
      scrim: token("scrim"),
      shadow: token("shadow"),
      success: token("success"),
      danger: token("danger"),
      chart: { a: token("chart-a"), b: token("chart-b") },
      skin: { DEFAULT: token("skin"), shade: token("skin-shade"), light: token("skin-light") },
      device: token("device"),
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      opacity: { 6: "0.06", 8: "0.08", 12: "0.12", 15: "0.15" },
      // Cùng offset/blur/spread/alpha với shadow mặc định của Tailwind (template-8), chỉ đổi màu đen → --c-shadow
      boxShadow: {
        sm: "0 1px 2px 0 rgb(var(--c-shadow) / .05)",
        lg: "0 10px 15px -3px rgb(var(--c-shadow) / .1), 0 4px 6px -4px rgb(var(--c-shadow) / .1)",
        xl: "0 20px 25px -5px rgb(var(--c-shadow) / .1), 0 8px 10px -6px rgb(var(--c-shadow) / .1)",
        "2xl": "0 25px 50px -12px rgb(var(--c-shadow) / .25)",
      },
    },
  },
  plugins: [],
};
export default config;
