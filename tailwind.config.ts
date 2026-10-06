import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: { 50:"rgb(var(--solar-rgb-primary-light) / <alpha-value>)", 100:"rgb(var(--solar-rgb-primary-light) / <alpha-value>)", 500:"rgb(var(--solar-rgb-primary) / <alpha-value>)", 600:"rgb(var(--solar-rgb-primary) / <alpha-value>)", 700:"rgb(var(--solar-rgb-primary-dark) / <alpha-value>)" },
        solar: { orange:"rgb(var(--solar-rgb-accent) / <alpha-value>)", blue:"rgb(var(--solar-rgb-primary) / <alpha-value>)", green:"rgb(var(--solar-rgb-primary-dark) / <alpha-value>)", yellow:"rgb(var(--solar-rgb-accent) / <alpha-value>)", beige:"rgb(var(--solar-rgb-accent-light) / <alpha-value>)", cream:"rgb(var(--solar-rgb-surface) / <alpha-value>)" },
        slate: { 50:"rgb(var(--solar-rgb-surface) / <alpha-value>)",100:"rgb(var(--solar-rgb-surface) / <alpha-value>)",200:"rgb(var(--solar-rgb-border) / <alpha-value>)",300:"rgb(var(--solar-rgb-border) / <alpha-value>)",400:"rgb(var(--solar-rgb-muted) / <alpha-value>)",500:"rgb(var(--solar-rgb-muted) / <alpha-value>)",600:"rgb(var(--solar-rgb-muted) / <alpha-value>)",700:"rgb(var(--solar-rgb-text) / <alpha-value>)",800:"rgb(var(--solar-rgb-text) / <alpha-value>)",900:"rgb(var(--solar-rgb-text) / <alpha-value>)",950:"rgb(var(--solar-rgb-primary-dark) / <alpha-value>)" },
        ...Object.fromEntries(["blue","sky","indigo","cyan","teal","emerald","green"].map(name=>[name,{50:"rgb(var(--solar-rgb-primary-light) / <alpha-value>)",100:"rgb(var(--solar-rgb-primary-light) / <alpha-value>)",200:"rgb(var(--solar-rgb-border) / <alpha-value>)",300:"rgb(var(--solar-rgb-primary-light) / <alpha-value>)",400:"rgb(var(--solar-rgb-primary) / <alpha-value>)",500:"rgb(var(--solar-rgb-primary) / <alpha-value>)",600:"rgb(var(--solar-rgb-primary) / <alpha-value>)",700:"rgb(var(--solar-rgb-primary-dark) / <alpha-value>)",800:"rgb(var(--solar-rgb-primary-dark) / <alpha-value>)",900:"rgb(var(--solar-rgb-primary-dark) / <alpha-value>)",950:"rgb(var(--solar-rgb-primary-dark) / <alpha-value>)"}])),
        ...Object.fromEntries(["amber","yellow","orange"].map(name=>[name,{50:"rgb(var(--solar-rgb-accent-light) / <alpha-value>)",100:"rgb(var(--solar-rgb-accent-light) / <alpha-value>)",200:"rgb(var(--solar-rgb-accent-light) / <alpha-value>)",300:"rgb(var(--solar-rgb-accent) / <alpha-value>)",400:"rgb(var(--solar-rgb-accent) / <alpha-value>)",500:"rgb(var(--solar-rgb-accent-dark) / <alpha-value>)",600:"rgb(var(--solar-rgb-accent-dark) / <alpha-value>)",700:"rgb(var(--solar-rgb-primary-dark) / <alpha-value>)",800:"rgb(var(--solar-rgb-primary-dark) / <alpha-value>)",900:"rgb(var(--solar-rgb-primary-dark) / <alpha-value>)",950:"rgb(var(--solar-rgb-primary-dark) / <alpha-value>)"}])),
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        "slide-in-left": "slide-in-left 0.6s ease-out forwards",
        "slide-in-right": "slide-in-right 0.6s ease-out forwards",
        "float-up": "float-up 3s ease-in-out infinite",
        "float-down": "float-down 3s ease-in-out infinite",
        "gradient-x": "gradient-x 3s ease infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        wave: "wave 6s ease-in-out infinite",
        "count-up": "count-up 0.6s ease-out 0.8s forwards",
      },
      keyframes: {
        "fade-in-up": { "0%": { opacity: "0", transform: "translateY(30px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "slide-in-left": { "0%": { opacity: "0", transform: "translateX(-50px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        "slide-in-right": { "0%": { opacity: "0", transform: "translateX(50px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        "float-up": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        "float-down": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(10px)" } },
        "gradient-x": { "0%, 100%": { "background-size": "200% 200%", "background-position": "left center" }, "50%": { "background-size": "200% 200%", "background-position": "right center" } },
        "spin-slow": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
        wave: { "0%, 100%": { transform: "translateX(0) translateY(0) scaleX(1)" }, "50%": { transform: "translateX(0) translateY(-3px) scaleX(1)" } },
        "count-up": { "0%": { opacity: "0", transform: "scale(0.5)" }, "100%": { opacity: "1", transform: "scale(1)" } },
      },
      boxShadow: { "3xl": "0 25px 50px -12px color-mix(in srgb,var(--solar-primary-dark) 25%,transparent)" },
      transitionDuration: { "600": "600ms", "800": "800ms", "900": "900ms", "1200": "1200ms" },
    },
  },
  plugins: [],
};
export default config;
