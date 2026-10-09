/** Màu lấy từ CSS variable dạng kênh "R G B" trong globals.css → hỗ trợ bg-primary/20 … */
/** @param {string} name */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

/** @type {Omit<import('tailwindcss').Config, 'content'>} */
const config = {
  theme: {
    // Thay HẲN bảng màu mặc định của Tailwind: chỉ còn màu từ design tokens,
    // nên không thể vô tình dùng bg-white, text-slate-500… trong component.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
      bg: { DEFAULT: token("bg"), elevated: token("bg-elevated"), deep: token("bg-deep"), tint: token("bg-tint"), sky: token("bg-sky"), sun: token("bg-sun") },
      glass: { DEFAULT: "var(--glass)", border: "var(--glass-border)", strong: "var(--glass-strong)", "strong-border": "var(--glass-strong-border)", tint: token("glass-tint") },
      primary: { DEFAULT: token("primary"), strong: token("primary-strong"), deep: token("primary-deep") },
      secondary: { DEFAULT: token("secondary"), deep: token("secondary-deep") },
      leaf: token("leaf"),
      sky: token("sky"),
      accent: { DEFAULT: token("accent"), soft: token("accent-soft"), ink: token("accent-ink") },
      "on-primary": token("on-primary"),
      "on-secondary": token("on-secondary"),
      "on-accent": token("on-accent"),
      "on-media": token("on-media"),
      fg: { DEFAULT: token("fg"), muted: token("fg-muted"), subtle: token("fg-subtle") },
      line: token("line"),
      scrim: token("scrim"),
      shadow: token("shadow"),
      success: token("success"),
      danger: token("danger"),
      chart: { a: token("chart-a"), b: token("chart-b") },
      skin: { DEFAULT: token("skin"), shade: token("skin-shade"), light: token("skin-light") },
      device: token("device"),
    },
    extend: {
      borderRadius: { card: "28px" },
      fontSize: { "2xs": "11px" },
      backgroundImage: {
        "media-glow": "radial-gradient(circle at 75% 20%, rgb(var(--c-accent) / .22), transparent 45%)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      // Font Be Vietnam Pro chỉ tải 3 độ đậm (400/600/800) — font-black dùng 800.
      fontWeight: { black: "800" },
      opacity: { 6: "0.06", 8: "0.08", 12: "0.12", 15: "0.15" },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(var(--c-shadow) / .12)",
        lg: "0 10px 15px -3px rgb(var(--c-shadow) / .18), 0 4px 6px -4px rgb(var(--c-shadow) / .18)",
        xl: "0 20px 25px -5px rgb(var(--c-shadow) / .2), 0 8px 10px -6px rgb(var(--c-shadow) / .2)",
        "2xl": "0 25px 50px -12px rgb(var(--c-shadow) / .35)",
      },
    },
  },
  plugins: [],
};
export default config;
