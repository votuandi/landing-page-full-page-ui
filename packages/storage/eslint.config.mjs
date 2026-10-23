import baseConfig, { nextConfig, prismaBoundary } from "@solar/config/eslint";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default [
  ...baseConfig,
  ...nextConfig(resolve(dirname(fileURLToPath(import.meta.url)), "../../apps/web"))
    .map((config) => "ignores" in config && !config.files ? config : { ...config, files: ["**/*.ts"] }),
  { files: ["**/*.mjs"], languageOptions: { globals: { process: "readonly" } } },
  { settings: { react: { version: "19.0" } } },
  {
    files: ["**/*.{ts,mjs}"],
    ignores: ["src/drivers/local.ts", "src/__tests__/**"],
    rules: {
      "no-restricted-imports": ["error", {
        ...prismaBoundary.rules["no-restricted-imports"][1],
        paths: ["fs", "node:fs", "fs/promises", "node:fs/promises"].map(name => ({ name, message: "Chỉ driver local được dùng fs." })),
      }],
    },
  },
];
