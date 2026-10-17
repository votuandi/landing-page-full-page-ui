import type { Config } from "tailwindcss";
import preset from "@solar/tokens/tailwind";

export default { presets: [preset], content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}", "../../packages/cms-ui/src/**/*.{ts,tsx}"] } satisfies Config;
