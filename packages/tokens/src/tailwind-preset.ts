import type { Config } from "tailwindcss";
import { COLOR_KEYS, GLASS_COLOR_KEYS } from "./color-keys";

const preset: Omit<Config, "content"> = {
  theme: {
    // Thay toàn bộ bảng màu mặc định; khóa màu luôn đồng bộ với schema.
    colors: {
      ...Object.fromEntries(COLOR_KEYS.map((key) => [key, `rgb(var(--c-${key}) / <alpha-value>)`])),
      ...Object.fromEntries(GLASS_COLOR_KEYS.map((key) => [key, `var(--${key})`])),
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
    },
    extend: {
      borderRadius: {
        card: "var(--radius-card)",
        pill: "var(--radius-pill)",
        media: "var(--radius-media)",
        input: "var(--radius-input)",
        button: "var(--radius-button)",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(var(--c-shadow) / calc(.12 * var(--shadow-strength)))",
        lg: "0 10px 15px -3px rgb(var(--c-shadow) / calc(.18 * var(--shadow-strength))), 0 4px 6px -4px rgb(var(--c-shadow) / calc(.18 * var(--shadow-strength)))",
        xl: "0 20px 25px -5px rgb(var(--c-shadow) / calc(.2 * var(--shadow-strength))), 0 8px 10px -6px rgb(var(--c-shadow) / calc(.2 * var(--shadow-strength)))",
        "2xl": "0 25px 50px -12px rgb(var(--c-shadow) / calc(.35 * var(--shadow-strength)))",
      },
      backdropBlur: { glass: "var(--glass-blur)" },
      transitionDuration: {
        "motion-fast": "var(--motion-fast)",
        "motion-base": "var(--motion-base)",
        "motion-slow": "var(--motion-slow)",
      },
      spacing: { section: "var(--section-y)" },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display, var(--font-sans))", "system-ui", "sans-serif"],
      },
      fontSize: { "2xs": "11px" },
      // Be Vietnam Pro hiện chỉ tải các độ đậm 400/600/800.
      fontWeight: { black: "800" },
      opacity: { 6: "0.06", 8: "0.08", 12: "0.12", 15: "0.15" },
      backgroundImage: {
        "media-glow": "radial-gradient(circle at 75% 20%, rgb(var(--c-accent) / .22), transparent 45%)",
      },
    },
  },
  plugins: [],
};

export default preset;
