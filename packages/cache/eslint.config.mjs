import baseConfig, { nextConfig } from "@solar/config/eslint";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default [
  // Plain Node process: reuse the shared TS rules without Next's Babel parser.
  ...baseConfig,
  ...nextConfig(resolve(dirname(fileURLToPath(import.meta.url)), "../../apps/web"))
    .map((config) => "ignores" in config && !config.files ? config : { ...config, files: ["**/*.ts"] }),
  { files: ["**/*.mjs"], languageOptions: { globals: { process: "readonly" } } },
  { settings: { react: { version: "19.0" } } },
];
