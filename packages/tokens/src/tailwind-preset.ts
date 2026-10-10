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
        screen: "calc(var(--radius-media) + 4px)",
        hero: "calc(var(--radius-media) + 8px)",
        dashboard: "calc(var(--radius-media) + 12px)",
      },
      boxShadow: {
        "card": "0 24px 60px -36px rgb(var(--c-shadow) / calc(.35 * var(--shadow-strength)))",
        "card-hover": "0 30px 70px -34px rgb(var(--c-primary) / calc(.45 * var(--shadow-strength)))",
        "glass": "0 18px 50px -24px rgb(var(--c-shadow) / calc(.35 * var(--shadow-strength)))",
        "float": "0 18px 50px -20px rgb(var(--c-shadow) / calc(.45 * var(--shadow-strength)))",
        "dashboard": "0 50px 100px -30px rgb(var(--c-shadow) / calc(.6 * var(--shadow-strength)))",
        "sun": "0 0 80px 20px rgb(var(--c-accent) / calc(.45 * var(--shadow-strength)))",
        "hero": "0 40px 80px -30px rgb(var(--c-shadow) / calc(.5 * var(--shadow-strength)))",
        "bottom-nav": "0 -20px 40px -24px rgb(var(--c-shadow) / calc(.6 * var(--shadow-strength)))",
        "package": "0 30px 60px -35px rgb(var(--c-shadow) / calc(.5 * var(--shadow-strength)))",
        "feature": "0 30px 60px -35px rgb(var(--c-shadow) / calc(.55 * var(--shadow-strength)))",
        "certificate": "0 20px 60px -30px rgb(var(--c-shadow) / calc(.25 * var(--shadow-strength)))",
        "video": "0 24px 50px -28px rgb(var(--c-shadow) / calc(.5 * var(--shadow-strength)))",
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
      fontSize: {
        "6xs": "8px",
        "5xs": "9px",
        "4xs": "10px",
        "3xs": "10.5px",
        "2xs": "11px",
        "body-sm": "13px",
        "body": "15px",
        "display-xs": "1.75rem",
        "display-sm": "2rem",
        "display-md": "2.55rem",
        "display-lg": "2.6rem",
        "display-xl": "3.9rem",
        "display-relative": "0.62em",
      },
      borderWidth: { 5: "5px", 6: "6px" },
      // Be Vietnam Pro hiện chỉ tải các độ đậm 400/600/800.
      fontWeight: { black: "800" },
      opacity: { 6: "0.06", 8: "0.08", 12: "0.12", 15: "0.15" },
      backgroundImage: {
        "glow-accent-18": "radial-gradient(circle,rgb(var(--c-accent)/.18),transparent 65%)",
        "glow-accent-22": "radial-gradient(circle,rgb(var(--c-accent)/.22),transparent 65%)",
        "glow-accent-25": "radial-gradient(circle,rgb(var(--c-accent)/.25),transparent 65%)",
        "glow-accent-30": "radial-gradient(circle,rgb(var(--c-accent)/.3),transparent 65%)",
        "glow-accent-soft-14": "radial-gradient(circle,rgb(var(--c-accent-soft)/.14),transparent 65%)",
        "glow-accent-soft-30": "radial-gradient(circle,rgb(var(--c-accent-soft)/.3),transparent 68%)",
        "glow-bg-tint-18": "radial-gradient(circle,rgb(var(--c-bg-tint)/.18),transparent 65%)",
        "glow-leaf-16": "radial-gradient(circle,rgb(var(--c-leaf)/.16),transparent 65%)",
        "glow-leaf-22": "radial-gradient(circle,rgb(var(--c-leaf)/.22),transparent 65%)",
        "glow-primary-14": "radial-gradient(circle,rgb(var(--c-primary)/.14),transparent 65%)",
        "glow-primary-25": "radial-gradient(circle,rgb(var(--c-primary)/.25),transparent 65%)",
        "glow-sky-20": "radial-gradient(circle,rgb(var(--c-sky)/.2),transparent 65%)",
        "sun-disc": "radial-gradient(circle at 35% 35%,rgb(var(--c-accent-soft)),rgb(var(--c-accent)) 60%)",
        "media-glow": "radial-gradient(circle at 75% 20%, rgb(var(--c-accent) / .22), transparent 45%)",
      },
    },
  },
  plugins: [],
};

export default preset;
