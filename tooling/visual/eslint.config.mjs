import { nextConfig } from "@solar/config/eslint";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const config = [
  { ignores: ["__screenshots__/**", "playwright-report/**", "test-results/**"] },
  ...nextConfig(resolve(dirname(fileURLToPath(import.meta.url)), "../../apps/web")),
  { settings: { react: { version: "19.0" } } },
];

export default config;
