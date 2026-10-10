import type { Config } from "tailwindcss";
import preset from "@solar/tokens/tailwind";

const config: Config = {
  presets: [preset],
  content: [
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/sections/src/**/*.{ts,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
