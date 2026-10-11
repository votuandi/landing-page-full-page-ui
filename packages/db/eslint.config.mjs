import baseConfig, { nextConfig } from "@solar/config/eslint";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default [
  { ignores: ["generated/**"] },
  // The package's Node scripts do not use Next's Babel parser.
  ...baseConfig,
  ...nextConfig(resolve(dirname(fileURLToPath(import.meta.url)), "../../apps/web"))
    .map((config) => "ignores" in config && !config.files ? config : { ...config, files: ["**/*.ts"] }),
  { files: ["**/*.mjs"], languageOptions: { globals: { process: "readonly", URL: "readonly" } } },
  { settings: { react: { version: "19.0" } } },
  { rules: { "no-restricted-imports": "off", "no-restricted-syntax": "off" } },
];
